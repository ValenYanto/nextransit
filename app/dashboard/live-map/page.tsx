import { Bus, Gauge, MapPinned, Navigation } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { StatusBadge } from "@/components/shared/status-badge";
import { LiveFleetMapWrapper } from "@/components/map/live-fleet-map-wrapper";

export const dynamic = "force-dynamic";

export default async function LiveMapPage() {
    const vehicles = await prisma.vehicle.findMany({
        orderBy: { code: "asc" },
        include: {
            currentRoute: true,
            positions: {
                take: 1,
                orderBy: { recordedAt: "desc" },
            },
        },
    });

    const markers = vehicles
        .map((vehicle) => {
            const position = vehicle.positions[0];

            if (!position) return null;

            return {
                id: vehicle.id,
                code: vehicle.code,
                type: vehicle.type,
                status: vehicle.status,
                routeName: vehicle.currentRoute?.name ?? "Unassigned route",
                latitude: position.latitude,
                longitude: position.longitude,
                speedKmh: position.speedKmh,
            };
        })
        .filter(Boolean) as Array<{
            id: string;
            code: string;
            type: string;
            status: string;
            routeName: string;
            latitude: number;
            longitude: number;
            speedKmh: number;
        }>;

    const activeCount = vehicles.filter((vehicle) => vehicle.status === "ACTIVE").length;
    const delayedCount = vehicles.filter((vehicle) => vehicle.status === "DELAYED").length;
    const avgSpeed =
        markers.length > 0
            ? Math.round(
                markers.reduce((sum, marker) => sum + marker.speedKmh, 0) /
                markers.length,
            )
            : 0;

    return (
        <div>
            <PageHeading
                label="Live Map"
                title="Live fleet monitoring"
                description="Visualisasi posisi armada pada peta untuk membantu operator memantau pergerakan dan status rute."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Tracked Fleet"
                    value={markers.length}
                    description="Fleet with latest position"
                    icon={MapPinned}
                />
                <MetricCard
                    title="Active"
                    value={activeCount}
                    description="Currently operating"
                    icon={Bus}
                />
                <MetricCard
                    title="Delayed"
                    value={delayedCount}
                    description="Need attention"
                    icon={Gauge}
                />
                <MetricCard
                    title="Average Speed"
                    value={`${avgSpeed} km/h`}
                    description="From latest position data"
                    icon={Navigation}
                />
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <LiveFleetMapWrapper markers={markers} />

                <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                    <CardContent className="p-5">
                        <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                            Fleet status
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Latest position data from registered vehicles.
                        </p>

                        <div className="mt-5 space-y-3">
                            {markers.map((marker) => (
                                <div
                                    key={marker.id}
                                    className="rounded-xl border border-slate-200 p-4 dark:border-white/10"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-medium">{marker.code}</p>
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                {marker.routeName}
                                            </p>
                                        </div>

                                        <StatusBadge status={marker.status} />
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <StatusBadge status={marker.type} />
                                        <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                                            {marker.speedKmh} km/h
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {markers.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    No fleet position available.
                                </p>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
