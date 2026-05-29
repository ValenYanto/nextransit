import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getDistanceKm, type Coordinate } from "@/lib/geo";
import { formatEta } from "@/lib/prediction/eta";
import { getCrowdLevel } from "@/lib/transit-live";
import { getBoardingRecommendation } from "@/lib/recommendation/boarding";

type JourneyRequest = {
    originStopId?: string;
    destinationStopId?: string;
    userLocation?: Coordinate;
    destinationLocation?: Coordinate;
};

type StopWithRoutes = Awaited<ReturnType<typeof loadStopRoutes>>[number];

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as JourneyRequest;
        const stops = await loadStopRoutes();

        const originStop = body.originStopId
            ? stops.find((stop) => stop.id === body.originStopId)
            : body.userLocation
                ? findNearestStop(body.userLocation, stops)
                : null;
        const destinationStop = body.destinationStopId
            ? stops.find((stop) => stop.id === body.destinationStopId)
            : body.destinationLocation
                ? findNearestStop(body.destinationLocation, stops)
                : null;

        if (!originStop || !destinationStop) {
            return NextResponse.json(
                { message: "Origin and destination stops are required.", options: [] },
                { status: 400 },
            );
        }

        if (originStop.id === destinationStop.id) {
            return NextResponse.json({
                originStop: serializeStop(originStop),
                destinationStop: serializeStop(destinationStop),
                options: [
                    {
                        id: "already-there",
                        label: "Fewer transfers",
                        totalMinutes: 2,
                        totalFormatted: "2 min",
                        crowdLevel: "LOW",
                        transferCount: 0,
                        recommended: true,
                        reason: "You are already near the selected destination stop.",
                        steps: [
                            {
                                type: "WALK",
                                title: "Walk to destination",
                                description: `${destinationStop.name} is already the closest stop.`,
                                from: originStop.name,
                                to: destinationStop.name,
                                route: null,
                                etaMinutes: 2,
                                crowdLevel: "LOW",
                                vehicleSuggestion: null,
                            },
                        ],
                    },
                ],
            });
        }

        const directRoutes = originStop.schedules
            .map((schedule) => schedule.route)
            .filter((route) =>
                destinationStop.schedules.some(
                    (destinationSchedule) => destinationSchedule.routeId === route.id,
                ),
            );

        const options = [];
        for (const route of directRoutes.slice(0, 2)) {
            const live = await getRouteLiveSummary(route.id);
            const approachMinutes = body.userLocation
                ? Math.max(2, Math.round((getDistanceKm(body.userLocation, originStop) / 4.2) * 60))
                : 3;
            const rideMinutes = estimateRideMinutes(route.distanceKm, route.type);
            const totalMinutes = approachMinutes + live.waitMinutes + rideMinutes;
            const recommendation = getBoardingRecommendation({
                crowdLevel: live.crowdLevel,
                etaMinutes: live.waitMinutes,
            });

            options.push({
                id: `direct-${route.id}`,
                label: "Fastest",
                totalMinutes,
                totalFormatted: formatEta(totalMinutes),
                crowdLevel: live.crowdLevel,
                transferCount: 0,
                recommended: true,
                reason: `Direct ${route.code} service from ${originStop.name} to ${destinationStop.name}.`,
                steps: [
                    buildWalkStep("Walk to origin stop", originStop.name, approachMinutes),
                    {
                        type: route.type,
                        title: `Take ${route.code}`,
                        description: `${route.name} toward ${route.destination}. ${recommendation.label}.`,
                        from: originStop.name,
                        to: destinationStop.name,
                        route: {
                            id: route.id,
                            code: route.code,
                            name: route.name,
                            mode: route.mode?.name ?? null,
                        },
                        etaMinutes: live.waitMinutes + rideMinutes,
                        crowdLevel: live.crowdLevel,
                        vehicleSuggestion: live.vehicle
                            ? `${live.vehicle.code}: ${live.vehicle.passengerCount}/${live.vehicle.capacity} passengers`
                            : recommendation.description,
                    },
                ],
            });
        }

        const transferOption = await buildTransferOption(originStop, destinationStop, body.userLocation);
        if (transferOption) options.push(transferOption);

        const fallbackOption = options.length === 0
            ? await buildFallbackOption(originStop, destinationStop, body.userLocation)
            : null;
        if (fallbackOption) options.push(fallbackOption);

        return NextResponse.json({
            originStop: serializeStop(originStop),
            destinationStop: serializeStop(destinationStop),
            options: options
                .sort((a, b) => a.totalMinutes - b.totalMinutes)
                .map((option, index) => ({
                    ...option,
                    recommended: index === 0,
                    label: index === 0 ? "Fastest" : option.label,
                }))
                .slice(0, 3),
        });
    } catch (error) {
        console.error("[PASSENGER_JOURNEY_ERROR]", error);
        return NextResponse.json(
            { message: "Failed to plan journey.", options: [] },
            { status: 500 },
        );
    }
}

async function loadStopRoutes() {
    return prisma.stop.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
            schedules: {
                include: {
                    route: {
                        include: { mode: true },
                    },
                },
                orderBy: { sequence: "asc" },
            },
        },
    });
}

function findNearestStop(location: Coordinate, stops: StopWithRoutes[]) {
    return stops.reduce<StopWithRoutes | null>((nearest, stop) => {
        if (!nearest) return stop;
        return getDistanceKm(location, stop) < getDistanceKm(location, nearest)
            ? stop
            : nearest;
    }, null);
}

async function getRouteLiveSummary(routeId: string) {
    const vehicles = await prisma.vehicle.findMany({
        where: {
            currentRouteId: routeId,
            status: { not: "OFFLINE" },
        },
        include: {
            positions: { take: 1, orderBy: { recordedAt: "desc" } },
            occupancies: { take: 1, orderBy: { recordedAt: "desc" } },
        },
    });

    const vehicle = vehicles
        .map((item) => {
            const position = item.positions[0];
            const occupancy = item.occupancies[0];
            const capacity = occupancy?.capacity ?? item.capacity;
            const passengerCount = occupancy?.passengerCount ?? 0;
            return {
                code: item.code,
                capacity,
                passengerCount,
                speedKmh: position?.speedKmh ?? 18,
                crowdLevel: getCrowdLevel(passengerCount, capacity),
            };
        })
        .sort((a, b) => a.passengerCount / a.capacity - b.passengerCount / b.capacity)[0];

    return {
        waitMinutes: vehicle ? Math.max(3, Math.round(16 - vehicle.speedKmh / 4)) : 8,
        crowdLevel: vehicle?.crowdLevel ?? "MEDIUM",
        vehicle: vehicle ?? null,
    };
}

async function buildTransferOption(
    originStop: StopWithRoutes,
    destinationStop: StopWithRoutes,
    userLocation?: Coordinate,
) {
    for (const originSchedule of originStop.schedules) {
        for (const destinationSchedule of destinationStop.schedules) {
            if (originSchedule.routeId === destinationSchedule.routeId) continue;

            const originRouteStops = await prisma.schedule.findMany({
                where: { routeId: originSchedule.routeId },
                include: { stop: true },
            });
            const destinationRouteStops = await prisma.schedule.findMany({
                where: { routeId: destinationSchedule.routeId },
                include: { stop: true },
            });
            const shared = originRouteStops.find((first) =>
                destinationRouteStops.some((second) => second.stopId === first.stopId),
            );

            if (!shared) continue;

            const firstLive = await getRouteLiveSummary(originSchedule.routeId);
            const secondLive = await getRouteLiveSummary(destinationSchedule.routeId);
            const approachMinutes = userLocation
                ? Math.max(2, Math.round((getDistanceKm(userLocation, originStop) / 4.2) * 60))
                : 3;
            const totalMinutes = approachMinutes + firstLive.waitMinutes + 18 + secondLive.waitMinutes + 16;
            const worstCrowd = crowdRank(firstLive.crowdLevel) >= crowdRank(secondLive.crowdLevel)
                ? firstLive.crowdLevel
                : secondLive.crowdLevel;

            return {
                id: `transfer-${originSchedule.routeId}-${destinationSchedule.routeId}`,
                label: "Fewer transfers",
                totalMinutes,
                totalFormatted: formatEta(totalMinutes),
                crowdLevel: worstCrowd,
                transferCount: 1,
                recommended: false,
                reason: `Transfer at ${shared.stop.name} connects ${originSchedule.route.code} and ${destinationSchedule.route.code}.`,
                steps: [
                    buildWalkStep("Walk to origin stop", originStop.name, approachMinutes),
                    buildRideStep(originSchedule.route, originStop.name, shared.stop.name, firstLive),
                    {
                        type: "TRANSFER",
                        title: `Transfer at ${shared.stop.name}`,
                        description: "Use the interchange guidance and check platform crowding before boarding.",
                        from: shared.stop.name,
                        to: shared.stop.name,
                        route: null,
                        etaMinutes: secondLive.waitMinutes,
                        crowdLevel: secondLive.crowdLevel,
                        vehicleSuggestion: "Transfer wait estimate included.",
                    },
                    buildRideStep(destinationSchedule.route, shared.stop.name, destinationStop.name, secondLive),
                ],
            };
        }
    }

    return null;
}

async function buildFallbackOption(
    originStop: StopWithRoutes,
    destinationStop: StopWithRoutes,
    userLocation?: Coordinate,
) {
    const interchange = ["Dukuh Atas", "Bundaran HI", "Harmoni", "Blok M", "Lebak Bulus"].find(
        (name) => originStop.name.includes(name) || destinationStop.name.includes(name),
    );
    const approachMinutes = userLocation
        ? Math.max(2, Math.round((getDistanceKm(userLocation, originStop) / 4.2) * 60))
        : 4;
    const totalMinutes = approachMinutes + 34;

    return {
        id: "fallback-interchange",
        label: "Less crowded",
        totalMinutes,
        totalFormatted: formatEta(totalMinutes),
        crowdLevel: "MEDIUM",
        transferCount: 1,
        recommended: true,
        reason: "No direct route found. Use the nearest interchange recommendation.",
        steps: [
            buildWalkStep("Walk to origin stop", originStop.name, approachMinutes),
            {
                type: "TRANSFER",
                title: `Head toward ${interchange ?? "nearest interchange"}`,
                description: "Use live route cards to choose the best corridor from this interchange.",
                from: originStop.name,
                to: destinationStop.name,
                route: null,
                etaMinutes: totalMinutes - approachMinutes,
                crowdLevel: "MEDIUM",
                vehicleSuggestion: "Recommended when direct service is unavailable.",
            },
        ],
    };
}

function buildWalkStep(title: string, stopName: string, etaMinutes: number) {
    return {
        type: "WALK",
        title,
        description: `Approach ${stopName} and check the live boarding recommendation.`,
        from: "Current location",
        to: stopName,
        route: null,
        etaMinutes,
        crowdLevel: "LOW",
        vehicleSuggestion: null,
    };
}

function buildRideStep(
    route: StopWithRoutes["schedules"][number]["route"],
    from: string,
    to: string,
    live: Awaited<ReturnType<typeof getRouteLiveSummary>>,
) {
    const recommendation = getBoardingRecommendation({
        crowdLevel: live.crowdLevel,
        etaMinutes: live.waitMinutes,
    });

    return {
        type: route.type,
        title: `Take ${route.code}`,
        description: `${route.name}. ${recommendation.label}.`,
        from,
        to,
        route: { id: route.id, code: route.code, name: route.name, mode: route.mode?.name ?? null },
        etaMinutes: live.waitMinutes + 18,
        crowdLevel: live.crowdLevel,
        vehicleSuggestion: live.vehicle
            ? `${live.vehicle.code}: ${live.vehicle.passengerCount}/${live.vehicle.capacity} passengers`
            : recommendation.description,
    };
}

function estimateRideMinutes(distanceKm: number, type: string) {
    const speed = type === "MRT" || type === "LRT" ? 36 : type === "BUS" ? 20 : 16;
    return Math.max(5, Math.round((distanceKm / speed) * 60));
}

function crowdRank(crowdLevel: string) {
    return { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }[crowdLevel.toUpperCase() as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"] ?? 2;
}

function serializeStop(stop: StopWithRoutes) {
    return {
        id: stop.id,
        code: stop.code,
        name: stop.name,
        type: stop.type,
        latitude: stop.latitude,
        longitude: stop.longitude,
        area: stop.area,
    };
}
