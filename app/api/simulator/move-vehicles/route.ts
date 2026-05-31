import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getDistanceKm } from "@/lib/geo";

const movementByType = {
    FEEDER: { speedKmh: 18, minStep: 2, maxStep: 4 },
    BUS: { speedKmh: 24, minStep: 2, maxStep: 5 },
    MRT: { speedKmh: 44, minStep: 4, maxStep: 8 },
    LRT: { speedKmh: 40, minStep: 4, maxStep: 8 },
};

export async function POST() {
    try {
        const vehicles = await prisma.vehicle.findMany({
            where: {
                status: {
                    not: "OFFLINE",
                },
                currentRouteId: {
                    not: null,
                },
            },
            include: {
                currentRoute: {
                    include: {
                        pathPoints: {
                            orderBy: { sequence: "asc" },
                        },
                        schedules: {
                            orderBy: { sequence: "asc" },
                            include: { stop: true },
                        },
                    },
                },
                positions: {
                    take: 1,
                    orderBy: { recordedAt: "desc" },
                },
            },
        });

        const updates = await Promise.all(
            vehicles.map(async (vehicle) => {
                const route = vehicle.currentRoute;
                const position = vehicle.positions[0];

                if (!route || !position) {
                    return null;
                }

                const pathPoints = route.pathPoints;

                if (pathPoints.length === 0) {
                    return null;
                }

                const nearestIndex = pathPoints.reduce((bestIndex, point, index) => {
                    const bestPoint = pathPoints[bestIndex];
                    const distance = getDistanceKm(position, point);
                    const bestDistance = getDistanceKm(position, bestPoint);
                    return distance < bestDistance ? index : bestIndex;
                }, 0);

                const movement = movementByType[vehicle.type];
                const speedRatio = Math.min(1, Math.max(0, position.speedKmh / Math.max(movement.speedKmh, 1)));
                const stepSize = Math.max(
                    movement.minStep,
                    Math.round(movement.minStep + (movement.maxStep - movement.minStep) * speedRatio),
                );
                const currentDirection = vehicle.direction === "INBOUND" ? "INBOUND" : "OUTBOUND";
                let nextDirection = currentDirection;
                let targetIndex =
                    currentDirection === "OUTBOUND"
                        ? nearestIndex + stepSize
                        : nearestIndex - stepSize;

                if (targetIndex >= pathPoints.length) {
                    nextDirection = "INBOUND";
                    targetIndex = Math.max(pathPoints.length - 1 - stepSize, 0);
                }

                if (targetIndex < 0) {
                    nextDirection = "OUTBOUND";
                    targetIndex = Math.min(stepSize, pathPoints.length - 1);
                }

                const targetPoint = pathPoints[targetIndex];
                const distanceToTargetKm = getDistanceKm(position, targetPoint);
                const speedKmh = distanceToTargetKm < 0.08
                    ? Math.max(8, Math.round(movement.speedKmh * 0.55))
                    : movement.speedKmh;
                const heading = calculateBearing(position, targetPoint);

                const [created] = await prisma.$transaction([
                    prisma.vehiclePosition.create({
                        data: {
                            vehicleId: vehicle.id,
                            latitude: targetPoint.latitude,
                            longitude: targetPoint.longitude,
                            speedKmh,
                            heading,
                            recordedAt: new Date(),
                        },
                    }),
                    prisma.vehicle.update({
                        where: { id: vehicle.id },
                        data: { direction: nextDirection },
                    }),
                ]);

                return {
                    vehicleId: vehicle.id,
                    code: vehicle.code,
                    fromPathIndex: nearestIndex,
                    toPathIndex: targetIndex,
                    direction: nextDirection,
                    latitude: created.latitude,
                    longitude: created.longitude,
                    speedKmh: created.speedKmh,
                };
            }),
        );

        return NextResponse.json({
            moved: updates.filter((update) => update !== null),
            generatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[MOVE_VEHICLES_ERROR]", error);
        return NextResponse.json(
            { message: "Failed to move vehicles." },
            { status: 500 },
        );
    }
}

function calculateBearing(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
) {
    const fromLat = toRadians(from.latitude);
    const toLat = toRadians(to.latitude);
    const deltaLng = toRadians(to.longitude - from.longitude);

    const y = Math.sin(deltaLng) * Math.cos(toLat);
    const x =
        Math.cos(fromLat) * Math.sin(toLat) -
        Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLng);

    return Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
}

function toRadians(value: number) {
    return (value * Math.PI) / 180;
}
