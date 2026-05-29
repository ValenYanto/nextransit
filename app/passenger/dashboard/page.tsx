import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ComponentType } from "react";
import { ArrowLeft, MapPinned, Radio, UsersRound } from "lucide-react";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { PassengerDashboardClient } from "@/components/passenger/passenger-dashboard-client";
import { JourneyPlanner } from "@/components/passenger/journey-planner";

export const dynamic = "force-dynamic";

export default async function PassengerDashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const [modes, routes, stops] = await Promise.all([
        prisma.transportMode.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: {
                        routes: {
                            where: { isActive: true },
                        },
                    },
                },
            },
        }),
        prisma.route.findMany({
            where: { isActive: true },
            orderBy: [{ type: "asc" }, { code: "asc" }],
            include: {
                mode: true,
                _count: {
                    select: {
                        vehicles: true,
                        schedules: true,
                    },
                },
            },
        }),
        prisma.stop.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
        }),
    ]);
    const liveUnitsByModeId = routes.reduce<Record<string, number>>((acc, route) => {
        if (!route.modeId) return acc;
        acc[route.modeId] = (acc[route.modeId] ?? 0) + route._count.vehicles;
        return acc;
    }, {});

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
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Home
                        </Link>
                    </Button>
                </div>
            </header>

            <section className="mx-auto max-w-7xl px-6 pb-12 pt-6">
                <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-none dark:border-white/10 dark:bg-slate-900/60">
                    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <div>
                            <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">
                                NexTransit Passenger
                            </p>
                            <h1 className="mt-2 font-[var(--font-jakarta)] text-3xl font-semibold tracking-tight sm:text-4xl">
                                Where are you going?
                            </h1>
                            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                Find a route, check arrivals, and see how crowded the next bus
                                or train is before you go.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <HeroMetric icon={Radio} label="Fleet Status" value="Live" />
                            <HeroMetric icon={UsersRound} label="Density" value="Realtime" />
                            <HeroMetric icon={MapPinned} label="Transfers" value="Integrated" />
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <JourneyPlanner
                        stops={stops.map((stop) => ({
                            id: stop.id,
                            code: stop.code,
                            name: stop.name,
                            type: stop.type,
                            latitude: stop.latitude,
                            longitude: stop.longitude,
                            area: stop.area,
                        }))}
                    />
                </div>

                <PassengerDashboardClient
                    modes={modes.map((mode) => ({
                        id: mode.id,
                        name: mode.name,
                        slug: mode.slug,
                        description: mode.description,
                        color: mode.color,
                        icon: mode.icon,
                        routeCount: mode._count.routes,
                        liveUnitCount: liveUnitsByModeId[mode.id] ?? 0,
                    }))}
                    routes={routes.map((route) => ({
                        id: route.id,
                        code: route.code,
                        name: route.name,
                        type: route.type,
                        origin: route.origin,
                        destination: route.destination,
                        distanceKm: route.distanceKm,
                        modeId: route.modeId,
                        modeName: route.mode?.name ?? null,
                        vehicleCount: route._count.vehicles,
                        stopCount: route._count.schedules,
                    }))}
                />
            </section>
        </main>
    );
}

function HeroMetric({
    icon: Icon,
    label,
    value,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
            <Icon className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 font-[var(--font-jakarta)] text-lg font-semibold">
                {value}
            </p>
        </div>
    );
}
