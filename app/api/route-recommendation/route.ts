import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
    calculateEtaMinutes,
    formatEta,
    getEtaConfidence,
} from "@/lib/prediction/eta";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const originStopId = String(body.originStopId ?? "");
        const destinationStopId = String(body.destinationStopId ?? "");

        if (!originStopId || !destinationStopId) {
            return NextResponse.json(
                { message: "Origin and destination are required." },
                { status: 400 },
            );
        }

        const [origin, destination, routes, vehicles, latestCrowd] =
            await Promise.all([
                prisma.stop.findUnique({ where: { id: originStopId } }),
                prisma.stop.findUnique({ where: { id: destinationStopId } }),
                prisma.route.findMany({
                    include: {
                        schedules: {
                            include: { stop: true },
                            orderBy: { sequence: "asc" },
                        },
                    },
                }),
                prisma.vehicle.findMany({
                    include: {
                        currentRoute: true,
                        positions: {
                            take: 1,
                            orderBy: { recordedAt: "desc" },
                        },
                    },
                }),
                prisma.crowdPrediction.findFirst({
                    orderBy: { createdAt: "desc" },
                    include: { stop: true },
                }),
            ]);

        if (!origin || !destination) {
            return NextResponse.json(
                { message: "Selected stop was not found." },
                { status: 404 },
            );
        }

        const feederRoute =
            routes.find((route) => route.type === "FEEDER") ?? routes[0];

        const railRoute =
            routes.find((route) => route.type === "MRT" || route.type === "LRT") ??
            routes[1] ??
            routes[0];

        const feederVehicle =
            vehicles.find((vehicle) => vehicle.type === "FEEDER") ?? vehicles[0];

        const speed = feederVehicle?.positions[0]?.speedKmh ?? 22;
        const trafficLevel = speed >= 30 ? "LOW" : speed >= 15 ? "MEDIUM" : "HIGH";
        const crowdLevel = latestCrowd?.densityLevel ?? "MEDIUM";

        const feederEta = calculateEtaMinutes({
            distanceKm: feederRoute?.distanceKm ?? 8,
            averageSpeedKmh: speed,
            trafficLevel,
            crowdLevel,
        });

        const transferWait =
            crowdLevel === "CRITICAL" ? 9 : crowdLevel === "HIGH" ? 7 : 4;

        const railEta = calculateEtaMinutes({
            distanceKm: railRoute?.distanceKm ?? 12,
            averageSpeedKmh: railRoute?.type === "MRT" || railRoute?.type === "LRT" ? 38 : 24,
            trafficLevel: "LOW",
            crowdLevel,
        });

        const totalMinutes = feederEta + transferWait + railEta;
        const confidence = getEtaConfidence(trafficLevel, crowdLevel);

        return NextResponse.json({
            origin,
            destination,
            totalMinutes,
            totalFormatted: formatEta(totalMinutes),
            confidence,
            trafficLevel,
            crowdLevel,
            steps: [
                {
                    mode: "FEEDER",
                    title: feederRoute?.name ?? "Feeder Service",
                    description: `${feederVehicle?.code ?? "Feeder"} arrives in ${formatEta(
                        feederEta,
                    )}`,
                    minutes: feederEta,
                },
                {
                    mode: "TRANSFER",
                    title: "Intermodal Transfer",
                    description: `Estimated transfer wait ${transferWait} min`,
                    minutes: transferWait,
                },
                {
                    mode: railRoute?.type ?? "MRT",
                    title: railRoute?.name ?? "MRT/LRT Connection",
                    description: `Estimated segment time ${formatEta(railEta)}`,
                    minutes: railEta,
                },
            ],
            insight:
                totalMinutes <= 45
                    ? "Recommended route is efficient for current condition."
                    : "Route is usable, but operator should monitor delay and crowd density.",
        });
    } catch (error) {
        console.error("[ROUTE_RECOMMENDATION_ERROR]", error);

        return NextResponse.json(
            { message: "Failed to generate route recommendation." },
            { status: 500 },
        );
    }
}