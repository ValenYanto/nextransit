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
            .filter((vehicle): vehicle is NonNullable<typeof vehicle> => vehicle !== null);
        const pathPoints = route.pathPoints.map((point) => ({
            latitude: point.latitude,
            longitude: point.longitude,
            sequence: point.sequence,
        }));
        const findNearestStopIndex = (vehicle: (typeof vehicles)[number]) => {
            if (stops.length === 0) return -1;

            return stops.reduce((bestIndex, stop, index) => {
                const bestStop = stops[bestIndex];
                const distance = Math.hypot(
                    vehicle.position.latitude - stop.latitude,
                    vehicle.position.longitude - stop.longitude,
                );
                const bestDistance = Math.hypot(
                    vehicle.position.latitude - bestStop.latitude,
                    vehicle.position.longitude - bestStop.longitude,
                );

                return distance < bestDistance ? index : bestIndex;
            }, 0);
        };
        const normalizeStopCrowdLevel = (occupancyRate: number) => {
            if (occupancyRate > 0.85) return "HIGH";
            if (occupancyRate > 0.6) return "MODERATE";
            return "LOW";
        };
        const routeNameParts = route.name.split(/\s[-–]\s/).map((part) => part.trim()).filter(Boolean);
        const getTerminalName = (direction: "OUTBOUND" | "INBOUND") => {
            const scheduledStopName =
                direction === "OUTBOUND"
                    ? stops[stops.length - 1]?.name
                    : stops[0]?.name;
            const routeTerminalName =
                direction === "OUTBOUND"
                    ? route.destination || routeNameParts[1]
                    : route.origin || routeNameParts[0];

            return scheduledStopName && scheduledStopName.length > 3
                ? scheduledStopName
                : routeTerminalName || scheduledStopName || (direction === "OUTBOUND" ? "End terminal" : "Start terminal");
        };
        const calculateETAToStop = (vehicle: (typeof vehicles)[number], targetStop: StopPoint) => {
            const vehicleStopIndex = findNearestStopIndex(vehicle);
            const targetStopIndex = stops.findIndex((stop) => stop.id === targetStop.id);

            if (vehicleStopIndex === -1 || targetStopIndex === -1) return -1;

            const stopsToPass =
                vehicle.direction === "INBOUND"
                    ? vehicleStopIndex - targetStopIndex
                    : targetStopIndex - vehicleStopIndex;

            if (stopsToPass < 0) return -1;
            if (stopsToPass === 0) return 0;

            const speed = vehicle.position.speedKmh > 0 ? vehicle.position.speedKmh : 18;
            const minutesPerStop = Math.max(1, Math.round((20 / speed) * 3));
            return stopsToPass * minutesPerStop;
        };
        const stopETAs = stops.map((stop) => ({
            stopId: stop.id,
            stopName: stop.name,
            vehicles: vehicles
                .map((vehicle) => {
                    const etaMinutes = calculateETAToStop(vehicle, stop);
                    if (etaMinutes === -1) return null;

                    return {
                        vehicleId: vehicle.id,
                        vehicleCode: vehicle.code,
                        direction: vehicle.direction,
                        etaMinutes,
                        etaLabel: etaMinutes === 0 ? "Sekarang" : `${etaMinutes} min`,
                        nextStopName: getTerminalName(vehicle.direction),
                        occupancy: vehicle.passengerCount,
                        capacity: vehicle.capacity,
                        crowdLevel: normalizeStopCrowdLevel(vehicle.occupancyRate),
                    };
                })
                .filter((vehicle): vehicle is NonNullable<typeof vehicle> => vehicle !== null)
                .sort((a, b) => a.etaMinutes - b.etaMinutes),
        }));
        const geometryValidation = validateRouteGeometry({
            points: pathPoints,
            stops,
            maxJumpKm: route.type === "LRT" ? 4 : route.type === "MRT" ? 2.5 : 5,
            maxDistanceFromStopsKm: route.type === "MRT" ? 4 : route.type === "LRT" ? 18 : 8,
        });

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
            stopETAs,
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
