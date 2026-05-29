import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { validateRouteGeometry } from "@/lib/routing/geometry-validation";
import {
    buildEtaToStop,
    findNextStop,
    getCrowdLevel,
    type StopPoint,
} from "@/lib/transit-live";

export async function GET(
    _request: Request,
    context: { params: Promise<{ routeId: string }> },
) {
    try {
        const { routeId } = await context.params;

        const route = await prisma.route.findFirst({
            where: {
                OR: [
                    { id: routeId },
                    { code: routeId },
                ],
            },
            include: {
                mode: true,
                schedules: {
                    orderBy: { sequence: "asc" },
                    include: {
                        stop: true,
                    },
                },
                pathPoints: {
                    orderBy: { sequence: "asc" },
                },
                vehicles: {
                    where: {
                        status: {
                            not: "OFFLINE",
                        },
                    },
                    orderBy: { code: "asc" },
                    include: {
                        positions: {
                            take: 1,
                            orderBy: { recordedAt: "desc" },
                        },
                        occupancies: {
                            take: 1,
                            orderBy: { recordedAt: "desc" },
                        },
                    },
                },
            },
        });

        if (!route || !route.isActive) {
            return NextResponse.json({ message: "Route not found." }, { status: 404 });
        }

        const stops: StopPoint[] = route.schedules.map((schedule) => ({
            id: schedule.stop.id,
            code: schedule.stop.code,
            name: schedule.stop.name,
            type: schedule.stop.type,
            latitude: schedule.stop.latitude,
            longitude: schedule.stop.longitude,
            area: schedule.stop.area,
            sequence: schedule.sequence,
            arrivalTime: schedule.arrivalTime,
            departureTime: schedule.departureTime,
        }));

        const vehicles = route.vehicles
            .map((vehicle) => {
                const position = vehicle.positions[0];
                if (!position) return null;

                const occupancy = vehicle.occupancies[0];
                const capacity = occupancy?.capacity ?? vehicle.capacity;
                const passengerCount = occupancy?.passengerCount ?? 0;
                const crowdLevel = getCrowdLevel(passengerCount, capacity);
                const direction = (vehicle.direction === "INBOUND" ? "INBOUND" : "OUTBOUND") as "INBOUND" | "OUTBOUND";
                const nextStop = findNextStop(position, stops, direction);
                const eta = nextStop
                    ? buildEtaToStop({
                        position,
                        stop: nextStop,
                        crowdLevel,
                    })
                    : null;

                return {
                    id: vehicle.id,
                    code: vehicle.code,
                    plateNumber: vehicle.plateNumber,
                    type: vehicle.type,
                    status: vehicle.status,
                    direction,
                    directionLabel:
                        direction === "INBOUND"
                            ? `${route.destination} → ${route.origin}`
                            : `${route.origin} → ${route.destination}`,
                    capacity,
                    passengerCount,
                    occupancyRate: capacity > 0 ? passengerCount / capacity : 0,
                    crowdLevel,
                    position: {
                        latitude: position.latitude,
                        longitude: position.longitude,
                        speedKmh: position.speedKmh,
                        heading: position.heading,
                        recordedAt: position.recordedAt.toISOString(),
                    },
                    nextStop: nextStop
                        ? {
                            id: nextStop.id,
                            name: nextStop.name,
                            latitude: nextStop.latitude,
                            longitude: nextStop.longitude,
                        }
                        : null,
                    etaToNextStopMinutes: eta?.etaMinutes ?? null,
                    etaToNextStopFormatted: eta?.etaFormatted ?? "No stop data",
                    trafficLevel: eta?.trafficLevel ?? "LOW",
                    confidence: eta?.confidence ?? 0.72,
                    lastUpdated: position.recordedAt.toISOString(),
                };
            })
            .filter((vehicle) => vehicle !== null);
        const pathPoints = route.pathPoints.map((point) => ({
            latitude: point.latitude,
            longitude: point.longitude,
            sequence: point.sequence,
        }));
        const geometryValidation = validateRouteGeometry({
            points: pathPoints,
            stops,
            maxJumpKm: route.type === "LRT" ? 4 : route.type === "MRT" ? 2.5 : 5,
            maxDistanceFromStopsKm: route.type === "MRT" ? 4 : route.type === "LRT" ? 18 : 8,
        });

        if (process.env.NODE_ENV === "development") {
            console.log("[PASSENGER_ROUTE_LIVE_PATH]", {
                routeId: route.id,
                routeCode: route.code,
                pathPointsLength: pathPoints.length,
                firstPathPoint: pathPoints[0] ?? null,
                lastPathPoint: pathPoints[pathPoints.length - 1] ?? null,
            });
        }

        return NextResponse.json({
            route: {
                id: route.id,
                code: route.code,
                name: route.name,
                type: route.type,
                origin: route.origin,
                destination: route.destination,
                distanceKm: route.distanceKm,
                pathSource: route.pathSource,
                pathPointCount: route.pathPointCount || pathPoints.length,
                pathUpdatedAt: route.pathUpdatedAt?.toISOString() ?? null,
                geometryStatus: geometryValidation.valid ? "valid" : "invalid",
                geometryReason: geometryValidation.reason ?? null,
                maxJumpKm: geometryValidation.maxJumpKm,
            },
            mode: route.mode
                ? {
                    id: route.mode.id,
                    name: route.mode.name,
                    slug: route.mode.slug,
                    color: route.mode.color,
                    icon: route.mode.icon,
                }
                : null,
            stops,
            pathPoints,
            vehicles,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[PASSENGER_ROUTE_LIVE_ERROR]", error);
        return NextResponse.json(
            { message: "Failed to load route live data." },
            { status: 500 },
        );
    }
}
