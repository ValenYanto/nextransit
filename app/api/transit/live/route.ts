import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getDistanceKm } from "@/lib/geo";
import {
    calculateEtaMinutes,
    formatEta,
    getEtaConfidence,
} from "@/lib/prediction/eta";

const DEFAULT_USER_LOCATION = {
    latitude: -6.301,
    longitude: 106.785,
};

function getCrowdLevel(passengerCount: number, capacity: number) {
    const ratio = capacity > 0 ? passengerCount / capacity : 0;

    if (ratio >= 0.9) return "CRITICAL";
    if (ratio >= 0.7) return "HIGH";
    if (ratio >= 0.4) return "MEDIUM";
    return "LOW";
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const userLatitude = Number(
            searchParams.get("lat") ?? DEFAULT_USER_LOCATION.latitude,
        );
        const userLongitude = Number(
            searchParams.get("lng") ?? DEFAULT_USER_LOCATION.longitude,
        );

        const userLocation = {
            latitude: userLatitude,
            longitude: userLongitude,
        };

        const vehicles = await prisma.vehicle.findMany({
            where: {
                status: {
                    not: "OFFLINE",
                },
            },
            include: {
                currentRoute: true,
                positions: {
                    take: 1,
                    orderBy: {
                        recordedAt: "desc",
                    },
                },
                occupancies: {
                    take: 1,
                    orderBy: {
                        recordedAt: "desc",
                    },
                },
            },
            orderBy: {
                code: "asc",
            },
        });

        const liveVehicles = vehicles
            .map((vehicle) => {
                const position = vehicle.positions[0];
                const occupancy = vehicle.occupancies[0];

                if (!position) return null;

                const passengerCount = occupancy?.passengerCount ?? 0;
                const capacity = occupancy?.capacity ?? vehicle.capacity;
                const crowdLevel = getCrowdLevel(passengerCount, capacity);

                const distanceToUserKm = getDistanceKm(userLocation, {
                    latitude: position.latitude,
                    longitude: position.longitude,
                });

                const trafficLevel =
                    position.speedKmh >= 30
                        ? "LOW"
                        : position.speedKmh >= 15
                            ? "MEDIUM"
                            : "HIGH";

                const etaMinutes = calculateEtaMinutes({
                    distanceKm: distanceToUserKm,
                    averageSpeedKmh: position.speedKmh || 18,
                    trafficLevel,
                    crowdLevel,
                });

                const confidence = getEtaConfidence(trafficLevel, crowdLevel);

                return {
                    id: vehicle.id,
                    code: vehicle.code,
                    plateNumber: vehicle.plateNumber,
                    type: vehicle.type,
                    status: vehicle.status,
                    capacity,
                    passengerCount,
                    occupancyRate: capacity > 0 ? passengerCount / capacity : 0,
                    crowdLevel,
                    route: vehicle.currentRoute
                        ? {
                            id: vehicle.currentRoute.id,
                            code: vehicle.currentRoute.code,
                            name: vehicle.currentRoute.name,
                            origin: vehicle.currentRoute.origin,
                            destination: vehicle.currentRoute.destination,
                            distanceKm: vehicle.currentRoute.distanceKm,
                        }
                        : null,
                    position: {
                        latitude: position.latitude,
                        longitude: position.longitude,
                        speedKmh: position.speedKmh,
                        heading: position.heading,
                        recordedAt: position.recordedAt,
                    },
                    distanceToUserKm: Number(distanceToUserKm.toFixed(2)),
                    etaMinutes,
                    etaFormatted: formatEta(etaMinutes),
                    trafficLevel,
                    confidence,
                };
            })
            .filter(Boolean)
            .sort((a, b) => {
                if (!a || !b) return 0;
                return a.etaMinutes - b.etaMinutes;
            });

        return NextResponse.json({
            userLocation,
            vehicles: liveVehicles,
            nearestVehicle: liveVehicles[0] ?? null,
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[TRANSIT_LIVE_ERROR]", error);

        return NextResponse.json(
            {
                message: "Failed to load live transit data.",
            },
            { status: 500 },
        );
    }
}