import { revalidatePath } from "next/cache";
import { Compass, GitBranch, Route as RouteIcon, Waypoints } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PathBuilderActions } from "@/components/admin/path-builder-actions";
import { PathBuilderMapWrapper } from "@/components/admin/path-builder-map-wrapper";
import { MetricCard } from "@/components/shared/metric-card";
import { StatusBadge } from "@/components/shared/status-badge";

export const dynamic = "force-dynamic";

async function clearPath(formData: FormData) {
    "use server";

    const routeId = String(formData.get("routeId") ?? "");
    if (!routeId) return;

    await prisma.$transaction([
        prisma.routePathPoint.deleteMany({ where: { routeId } }),
        prisma.route.update({
            where: { id: routeId },
            data: {
                pathSource: "FALLBACK",
                pathUpdatedAt: new Date(),
                pathPointCount: 0,
            },
        }),
    ]);
    revalidatePath("/dashboard/path-builder");
    revalidatePath("/dashboard/routes");
}

export default async function PathBuilderPage() {
    const routes = await prisma.route.findMany({
        orderBy: { code: "asc" },
        include: {
            mode: true,
            pathPoints: true,
            schedules: {
                orderBy: { sequence: "asc" },
                include: { stop: true },
            },
        },
    });

    const pathPointCount = routes.reduce((sum, route) => sum + (route.pathPointCount || route.pathPoints.length), 0);
    const rebuildReady = routes.filter((route) => route.schedules.length > 1).length;

    return (
        <div className="space-y-6">
            <div>
                <p className="text-sm text-[#757780]">Path Builder</p>
                <h1 className="mt-1 text-3xl font-semibold text-[#001011] dark:text-[#FFFFFC]">
                    Build route paths visually
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#757780]">
                    Select a route, review current stops, click on the map to draft path points,
                    and save a clean manual path when operator adjustment is needed.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <MetricCard title="Route Paths" value={routes.length} description="Managed corridors and lines" icon={RouteIcon} />
                <MetricCard title="Path Points" value={pathPointCount} description="Stored polyline geometry" icon={Waypoints} />
                <MetricCard title="Ready to Build" value={rebuildReady} description="Routes with 2+ stops" icon={Compass} />
            </div>

            <div>
                <PathBuilderMapWrapper
                    routes={routes.map((route) => ({
                        id: route.id,
                        code: route.code,
                        name: route.name,
                        type: route.type,
                        origin: route.origin,
                        destination: route.destination,
                        pathSource: route.pathSource,
                        pathPointCount: route.pathPointCount,
                        stops: route.schedules.map((schedule) => ({
                            id: schedule.stop.id,
                            code: schedule.stop.code,
                            name: schedule.stop.name,
                            type: schedule.stop.type,
                            latitude: schedule.stop.latitude,
                            longitude: schedule.stop.longitude,
                            sequence: schedule.sequence,
                        })),
                        pathPoints: route.pathPoints
                            .sort((a, b) => a.sequence - b.sequence)
                            .map((point) => ({
                                latitude: point.latitude,
                                longitude: point.longitude,
                                sequence: point.sequence,
                            })),
                    }))}
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {routes.map((route) => (
                    <Card key={route.id} className="rounded-2xl border-black/10 bg-white shadow-none dark:border-white/10 dark:bg-[#0a1a1c]">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <StatusBadge status={route.type} />
                                        <span className="text-xs text-[#757780]">{route.code} · {route.mode?.name ?? "No mode"}</span>
                                    </div>
                                    <h2 className="mt-3 font-[var(--font-jakarta)] text-lg font-semibold">{route.name}</h2>
                                    <p className="mt-1 text-sm text-[#757780]">
                                        {route.origin} to {route.destination}
                                    </p>
                                </div>
                                <GitBranch className="h-5 w-5 text-[#6CCFF6]" />
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <Metric label="Stops" value={route.schedules.length} />
                                <Metric label="Path points" value={route.pathPointCount || route.pathPoints.length} />
                                <Metric label="Path source" value={route.pathSource ?? "UNKNOWN"} />
                                <Metric
                                    label="Updated"
                                    value={route.pathUpdatedAt ? route.pathUpdatedAt.toLocaleString("id-ID") : "-"}
                                />
                            </div>

                            <div className="mt-5 space-y-2">
                                {route.schedules.map((schedule) => (
                                    <div key={schedule.id} className="rounded-xl border border-black/10 px-3 py-2 text-sm dark:border-white/10">
                                        <span className="font-medium">{schedule.sequence}. {schedule.stop.name}</span>
                                        <span className="ml-2 text-xs text-[#757780]">
                                            {schedule.stop.latitude.toFixed(4)}, {schedule.stop.longitude.toFixed(4)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 flex flex-wrap gap-2">
                                {route.schedules.length >= 2 ? (
                                    <div className="space-y-3">
                                        <PathBuilderActions routeId={route.id} routeType={route.type} />
                                        {route.type === "MRT" || route.type === "LRT" ? (
                                            <p className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300">
                                                Rail routes use track alignment, not road driving.
                                            </p>
                                        ) : null}
                                    </div>
                                ) : null}
                                <form action={clearPath}>
                                    <input type="hidden" name="routeId" value={route.id} />
                                    <Button variant="outline" className="rounded-xl border-[#6CCFF6] bg-transparent text-[#6CCFF6] shadow-none">
                                        Clear path
                                    </Button>
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl bg-[#757780]/10 p-3">
            <p className="text-xs text-[#757780]">{label}</p>
            <p className="mt-1 text-sm font-semibold">{value}</p>
        </div>
    );
}
