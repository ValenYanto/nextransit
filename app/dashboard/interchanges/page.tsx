import { GitMerge, MapPinned, Route } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";

export const dynamic = "force-dynamic";

const interchangeNames = ["Dukuh Atas", "Bundaran HI", "Lebak Bulus", "Blok M", "Harmoni", "Fatmawati"];

export default async function InterchangesPage() {
    const stops = await prisma.stop.findMany({
        where: {
            OR: interchangeNames.map((name) => ({
                name: {
                    contains: name,
                    mode: "insensitive" as const,
                },
            })),
        },
        include: {
            schedules: {
                include: {
                    route: {
                        include: { mode: true },
                    },
                },
            },
        },
        orderBy: { name: "asc" },
    });

    const connectedRoutes = new Set(
        stops.flatMap((stop) => stop.schedules.map((schedule) => schedule.routeId)),
    ).size;

    return (
        <div>
            <PageHeading
                label="Interchanges"
                title="Intermodal connectivity"
                description="Transfer-ready nodes for feeder, TransJakarta, MRT, and LRT recommendations in DISHUB Case 2."
            />

            <div className="grid gap-4 md:grid-cols-3">
                <MetricCard title="Transfer Nodes" value={stops.length} description="Detected from seeded data" icon={GitMerge} />
                <MetricCard title="Connected Routes" value={connectedRoutes} description="Routes passing interchange stops" icon={Route} />
                <MetricCard title="Crowd Risk" value="Simulated" description="Transfer monitoring ready" icon={MapPinned} />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {stops.map((stop) => {
                    const routeLabels = stop.schedules.map((schedule) => ({
                        code: schedule.route.code,
                        mode: schedule.route.mode?.name ?? schedule.route.type,
                    }));
                    const risk = routeLabels.length >= 3 ? "HIGH" : routeLabels.length === 2 ? "MEDIUM" : "LOW";

                    return (
                        <Card
                            key={stop.id}
                            className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950"
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">
                                            {stop.area ?? "Jakarta"}
                                        </p>
                                        <h2 className="mt-2 font-[var(--font-jakarta)] text-xl font-semibold">
                                            {stop.name}
                                        </h2>
                                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                            Supports passenger transfer recommendation, route planning,
                                            headway monitoring, and rush hour simulation.
                                        </p>
                                        <p className="mt-2 text-xs font-medium text-cyan-700 dark:text-cyan-300">
                                            Simulated transfer crowd risk: {risk}
                                        </p>
                                    </div>
                                    <GitMerge className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                                </div>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    {routeLabels.map((route) => (
                                        <span
                                            key={`${stop.id}-${route.code}`}
                                            className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400"
                                        >
                                            {route.code} · {route.mode}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
