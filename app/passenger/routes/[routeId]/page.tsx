import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ArrowLeft, MapPinned } from "lucide-react";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateRouteGeometry } from "@/lib/routing/geometry-validation";
import { buildEtaToStop, findNextStop, getCrowdLevel } from "@/lib/transit-live";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { StatusBadge } from "@/components/shared/status-badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";
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
        generatedAt: new Date().toISOString(),
    };

    return (
        <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
            <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                <Logo href="/passenger/dashboard" />
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button
                        asChild
                        variant="outline"
                        className="rounded-xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-transparent"
                    >
                        <Link href="/passenger/dashboard">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Routes
                        </Link>
                    </Button>
                </div>
            </header>

            <section className="mx-auto max-w-7xl px-6 pb-12 pt-6">
                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-none dark:border-white/10 dark:bg-slate-900/60">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <StatusBadge status={route.type} />
                                {route.mode ? <StatusBadge status={route.mode.name} /> : null}
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    {route.code}
                                </span>
                            </div>
                            <h1 className="mt-3 font-[var(--font-jakarta)] text-3xl font-semibold tracking-tight sm:text-4xl">
                                {route.name}
                            </h1>
                            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                {route.origin} to {route.destination} · {route.distanceKm.toFixed(1)} km ·
                                see arrivals, crowd level, stops, and transfers.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                            <MapPinned className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                            <p className="mt-3 text-sm font-medium">
                                {stops.length} stops · {vehicles.length} live units
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                GPS is used only in the browser for your current location.
                            </p>
                        </div>
                    </div>
                </div>

                <RouteLiveClient routeId={route.id} initialData={initialData} />
            </section>
        </main>
    );
}

function RouteNotFound() {
    return (
        <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950 dark:bg-slate-950 dark:text-white">
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-none dark:border-white/10 dark:bg-slate-900">
                <Logo href="/passenger/dashboard" />
                <h1 className="mt-8 font-[var(--font-jakarta)] text-2xl font-semibold">
                    Route not found
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Route not found or seed data changed. Please go back to a route list and open the current live route link.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild className="rounded-xl bg-slate-950 text-white shadow-none dark:bg-white dark:text-slate-950">
                        <Link href="/passenger/dashboard">Passenger routes</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-transparent">
                        <Link href="/dashboard/routes">Operator routes</Link>
                    </Button>
                </div>
            </div>
        </main>
    );
}
