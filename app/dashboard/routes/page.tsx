import { Bus, MapPinned, Route as RouteIcon, Waypoints } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { StatusBadge } from "@/components/shared/status-badge";

export default async function RoutesPage() {
    const routes = await prisma.route.findMany({
        orderBy: {
            code: "asc",
        },
        include: {
            vehicles: true,
            schedules: {
                include: {
                    stop: true,
                },
                orderBy: {
                    sequence: "asc",
                },
            },
        },
    });

    const totalDistance = routes.reduce((sum, route) => sum + route.distanceKm, 0);
    const totalFleet = routes.reduce((sum, route) => sum + route.vehicles.length, 0);
    const totalSchedules = routes.reduce(
        (sum, route) => sum + route.schedules.length,
        0,
    );

    return (
        <div>
            <PageHeading
                label="Routes"
                title="Routes and stops"
                description="Lihat daftar rute, jarak operasional, armada yang terhubung, dan urutan halte/stasiun."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Total Routes"
                    value={routes.length}
                    description="Registered transit routes"
                    icon={RouteIcon}
                />
                <MetricCard
                    title="Fleet Assigned"
                    value={totalFleet}
                    description="Vehicles connected to routes"
                    icon={Bus}
                />
                <MetricCard
                    title="Schedule Points"
                    value={totalSchedules}
                    description="Stop schedule entries"
                    icon={Waypoints}
                />
                <MetricCard
                    title="Total Distance"
                    value={`${totalDistance.toFixed(1)} km`}
                    description="Combined route distance"
                    icon={MapPinned}
                />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {routes.map((route) => (
                    <Card
                        key={route.id}
                        className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950"
                    >
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={route.type} />
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {route.code}
                                        </span>
                                    </div>

                                    <h2 className="mt-3 font-[var(--font-jakarta)] text-lg font-semibold">
                                        {route.name}
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {route.origin} → {route.destination}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="font-[var(--font-jakarta)] text-2xl font-semibold">
                                        {route.distanceKm.toFixed(1)}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        km
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Fleet
                                    </p>
                                    <p className="mt-1 font-semibold">{route.vehicles.length}</p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Stops
                                    </p>
                                    <p className="mt-1 font-semibold">{route.schedules.length}</p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-2">
                                {route.schedules.map((schedule) => (
                                    <div
                                        key={schedule.id}
                                        className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-white/10"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">{schedule.stop.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Stop #{schedule.sequence}
                                            </p>
                                        </div>

                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {schedule.arrivalTime}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}