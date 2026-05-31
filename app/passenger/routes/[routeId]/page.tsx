import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateRouteGeometry } from "@/lib/routing/geometry-validation";
import { buildEtaToStop, findNextStop, getCrowdLevel } from "@/lib/transit-live";
import { Button } from "@/components/ui/button";
import { RouteLiveClient } from "@/components/passenger/route-live-client";
import type { RouteLiveStop } from "@/components/passenger/route-live-map";

export const dynamic = "force-dynamic";

export default async function PassengerRoutePage({
    params,
}: {
    params: Promise<{ routeId: string }>;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const { routeId } = await params;
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
                include: { stop: true },
            },
            pathPoints: {
                orderBy: { sequence: "asc" },
            },
            vehicles: {
                where: { status: { not: "OFFLINE" } },
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
        return <RouteNotFound />;
    }

    const stops: RouteLiveStop[] = route.schedules.map((schedule) => ({
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
                ? buildEtaToStop({ position, stop: nextStop, crowdLevel })
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
    const calculateETAToStop = (vehicle: (typeof vehicles)[number], targetStop: RouteLiveStop) => {
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
    const getStopCrowdLevel = (occupancyRate: number): "LOW" | "MODERATE" | "HIGH" => {
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
                    crowdLevel: getStopCrowdLevel(vehicle.occupancyRate),
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

    const initialData = {
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
    };

    return (
        <main className="min-h-screen overflow-x-hidden bg-[#FFFFFC] text-[#001011] dark:bg-[#001011] dark:text-[#FFFFFC]">
            <header className="sticky top-0 z-40 border-b border-black/10 bg-[#FFFFFC]/90 backdrop-blur dark:border-white/10 dark:bg-[#001011]/90">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
                    <Button
                        asChild
                        variant="ghost"
                        className="h-11 w-11 rounded-full p-0 text-[#001011] dark:text-[#FFFFFC]"
                    >
                        <Link href="/passenger/dashboard" aria-label="Back to dashboard">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="min-w-0 flex-1 text-center">
                        <div className="flex min-w-0 items-center justify-center gap-2">
                            <span className="rounded-full bg-[#6CCFF6]/15 px-3 py-1 font-mono text-xs font-semibold text-[#6CCFF6]">
                                {route.code}
                            </span>
                            <h1 className="truncate text-sm font-semibold sm:text-base">{route.name}</h1>
                        </div>
                        <p className="mt-1 truncate text-xs text-[#757780]">
                            {route.origin} → {route.destination}
                        </p>
                    </div>
                    <span className="rounded-full bg-[#10B981]/15 px-3 py-1 text-xs font-semibold text-[#10B981]">
                        {route.mode?.name ?? route.type}
                    </span>
                </div>
            </header>

            <section className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6">
                <div className="rounded-3xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#0a1a1c]">
                    <p className="text-sm text-[#757780]">Live route</p>
                    <h2 className="mt-1 text-2xl font-semibold">{route.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#757780]">
                        {stops.length} stops · {vehicles.length} live units · see arrival time, passengers, crowd, and boarding advice.
                    </p>
                </div>

                <RouteLiveClient routeId={route.id} initialData={initialData} />
            </section>
        </main>
    );
}

function RouteNotFound() {
    return (
        <main className="min-h-screen bg-[#FFFFFC] px-6 py-10 text-[#001011] dark:bg-[#001011] dark:text-[#FFFFFC]">
            <div className="mx-auto max-w-2xl rounded-2xl border border-black/10 bg-white p-6 shadow-none dark:border-white/10 dark:bg-[#0a1a1c]">
                <h1 className="mt-8 font-[var(--font-jakarta)] text-2xl font-semibold">
                    Route not found
                </h1>
                <p className="mt-3 text-sm leading-6 text-[#757780]">
                    Route not found or seed data changed. Please go back to a route list and open the current live route link.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild className="rounded-xl bg-[#6CCFF6] text-[#001011] shadow-none">
                        <Link href="/passenger/dashboard">Passenger routes</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-xl border-[#6CCFF6] bg-transparent text-[#6CCFF6] shadow-none">
                        <Link href="/dashboard/routes">Operator routes</Link>
                    </Button>
                </div>
            </div>
        </main>
    );
}
