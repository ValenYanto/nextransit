import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getDistanceKm } from "@/lib/geo";
import { buildEtaToStop, getCrowdLevel } from "@/lib/transit-live";

type NearbyRequest = {
    latitude?: number;
    longitude?: number;
    routeId?: string;
};

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as NearbyRequest;
        const latitude = Number(body.latitude);
        const longitude = Number(body.longitude);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return NextResponse.json(
                { message: "Valid latitude and longitude are required." },
                { status: 400 },
            );
        }

        const userLocation = { latitude, longitude };
        const routeFilter = body.routeId ? { routeId: body.routeId } : {};

        const [schedules, vehicles] = await Promise.all([
            prisma.schedule.findMany({
                where: routeFilter,
                include: {
                    route: true,
                    stop: true,
                },
                orderBy: { sequence: "asc" },
            }),
            prisma.vehicle.findMany({
                where: {
                    status: { not: "OFFLINE" },
                    ...(body.routeId ? { currentRouteId: body.routeId } : {}),
                },
                include: {
                    currentRoute: true,
                    positions: {
                        take: 1,
                        orderBy: { recordedAt: "desc" },
                    },
                    occupancies: {
                        take: 1,
                        orderBy: { recordedAt: "desc" },
                    },
                },
            }),
        ]);

        const nearbyStops = schedules
            .map((schedule) => ({
                id: schedule.stop.id,
                code: schedule.stop.code,
                name: schedule.stop.name,
                type: schedule.stop.type,
                latitude: schedule.stop.latitude,
                longitude: schedule.stop.longitude,
                area: schedule.stop.area,
                route: {
                    id: schedule.route.id,
                    code: schedule.route.code,
                    name: schedule.route.name,
                },
                sequence: schedule.sequence,
                distanceKm: getDistanceKm(userLocation, schedule.stop),
            }))
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, 8)
            .map((stop) => ({
                ...stop,
                distanceKm: Number(stop.distanceKm.toFixed(2)),
            }));

        const nearbyVehicles = vehicles
            .map((vehicle) => {
                const position = vehicle.positions[0];
                if (!position) return null;

                const occupancy = vehicle.occupancies[0];
                const capacity = occupancy?.capacity ?? vehicle.capacity;
                const passengerCount = occupancy?.passengerCount ?? 0;
                const crowdLevel = getCrowdLevel(passengerCount, capacity);
                const distanceKm = getDistanceKm(userLocation, position);
                const eta = buildEtaToStop({
                    position,
                    stop: userLocation,
                    crowdLevel,
                });

                return {
                    id: vehicle.id,
                    code: vehicle.code,
                    type: vehicle.type,
                    status: vehicle.status,
                    route: vehicle.currentRoute
                        ? {
                            id: vehicle.currentRoute.id,
                            code: vehicle.currentRoute.code,
                            name: vehicle.currentRoute.name,
                        }
                        : null,
                    passengerCount,
                    capacity,
                    crowdLevel,
                    distanceKm: Number(distanceKm.toFixed(2)),
                    etaMinutes: eta.etaMinutes,
                    etaFormatted: eta.etaFormatted,
                    position: {
                        latitude: position.latitude,
                        longitude: position.longitude,
                        speedKmh: position.speedKmh,
                        recordedAt: position.recordedAt.toISOString(),
                    },
                };
            })
            .filter((vehicle) => vehicle !== null)
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, 8);

        return NextResponse.json({
            userLocation,
            stops: nearbyStops,
            vehicles: nearbyVehicles,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[PASSENGER_NEARBY_ERROR]", error);
        return NextResponse.json(
            { message: "Failed to load nearby transit data." },
            { status: 500 },
        );
    }
}
