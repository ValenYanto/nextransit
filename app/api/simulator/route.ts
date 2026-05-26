import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { calculateEtaMinutes, formatEta } from "@/lib/prediction/eta";
import {
    simulateScenario,
    type SimulationScenario,
} from "@/lib/prediction/simulator";

const validScenarios: SimulationScenario[] = [
    "NORMAL",
    "RUSH_HOUR",
    "RAIN",
    "EVENT",
];

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const scenario = String(body.scenario ?? "NORMAL") as SimulationScenario;

        if (!validScenarios.includes(scenario)) {
            return NextResponse.json(
                { message: "Invalid scenario." },
                { status: 400 },
            );
        }

        const simulation = simulateScenario(scenario);

        const [vehicles, routes, latestTaps] = await Promise.all([
            prisma.vehicle.findMany({
                include: {
                    currentRoute: true,
                    positions: {
                        take: 1,
                        orderBy: { recordedAt: "desc" },
                    },
                },
            }),
            prisma.route.findMany(),
            prisma.passengerTap.findMany({
                take: 10,
                orderBy: { timestamp: "desc" },
            }),
        ]);

        const basePassengerMovement = latestTaps.reduce(
            (sum, tap) => sum + tap.countIn + tap.countOut,
            0,
        );

        const predictedPassengerMovement = Math.round(
            basePassengerMovement * simulation.passengerMultiplier,
        );

        const route = routes[0];
        const avgSpeed =
            vehicles.length > 0
                ? vehicles.reduce(
                    (sum, vehicle) => sum + (vehicle.positions[0]?.speedKmh ?? 20),
                    0,
                ) / vehicles.length
                : 22;

        const adjustedSpeed = Math.max(8, avgSpeed / simulation.delayMultiplier);

        const eta = calculateEtaMinutes({
            distanceKm: route?.distanceKm ?? 8,
            averageSpeedKmh: adjustedSpeed,
            trafficLevel: simulation.trafficLevel,
            crowdLevel: simulation.crowdLevel,
        });

        const recommendedFleet =
            simulation.scenario === "EVENT"
                ? 4
                : simulation.scenario === "RUSH_HOUR"
                    ? 3
                    : simulation.scenario === "RAIN"
                        ? 2
                        : 1;

        return NextResponse.json({
            scenario,
            summary: simulation.summary,
            recommendation: simulation.recommendation,
            trafficLevel: simulation.trafficLevel,
            crowdLevel: simulation.crowdLevel,
            delayMultiplier: simulation.delayMultiplier,
            passengerMultiplier: simulation.passengerMultiplier,
            basePassengerMovement,
            predictedPassengerMovement,
            adjustedSpeed: Math.round(adjustedSpeed),
            etaMinutes: eta,
            etaFormatted: formatEta(eta),
            recommendedFleet,
        });
    } catch (error) {
        console.error("[SIMULATOR_ERROR]", error);

        return NextResponse.json(
            { message: "Failed to run simulation." },
            { status: 500 },
        );
    }
}