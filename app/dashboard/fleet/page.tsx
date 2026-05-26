import { Bus, Gauge, MapPin, UsersRound } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { StatusBadge } from "@/components/shared/status-badge";

export default async function FleetPage() {
    const vehicles = await prisma.vehicle.findMany({
        orderBy: {
            code: "asc",
        },
        include: {
            currentRoute: true,
            positions: {
                take: 1,
                orderBy: {
                    recordedAt: "desc",
                },
            },
        },
    });

    const activeCount = vehicles.filter((vehicle) => vehicle.status === "ACTIVE").length;
    const delayedCount = vehicles.filter((vehicle) => vehicle.status === "DELAYED").length;
    const totalCapacity = vehicles.reduce((sum, vehicle) => sum + vehicle.capacity, 0);
    const averageSpeed =
        vehicles.length > 0
            ? Math.round(
                vehicles.reduce(
                    (sum, vehicle) => sum + (vehicle.positions[0]?.speedKmh ?? 0),
                    0,
                ) / vehicles.length,
            )
            : 0;

    return (
        <div>
            <PageHeading
                label="Fleet"
                title="Fleet monitoring"
                description="Pantau status armada, rute aktif, kapasitas, dan posisi terakhir secara ringkas."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Total Fleet"
                    value={vehicles.length}
                    description={`${activeCount} active fleet`}
                    icon={Bus}
                />
                <MetricCard
                    title="Delayed"
                    value={delayedCount}
                    description="Need operational attention"
                    icon={Gauge}
                />
                <MetricCard
                    title="Total Capacity"
                    value={totalCapacity}
                    description="Passenger capacity"
                    icon={UsersRound}
                />
                <MetricCard
                    title="Avg Speed"
                    value={`${averageSpeed} km/h`}
                    description="Latest recorded speed"
                    icon={MapPin}
                />
            </div>

            <Card className="mt-6 rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                <CardContent className="p-0">
                    <div className="border-b border-slate-200 p-5 dark:border-white/10">
                        <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                            Fleet list
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Latest operational status from seeded fleet data.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Fleet</th>
                                    <th className="px-5 py-3 font-medium">Type</th>
                                    <th className="px-5 py-3 font-medium">Route</th>
                                    <th className="px-5 py-3 font-medium">Capacity</th>
                                    <th className="px-5 py-3 font-medium">Speed</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium">Last Position</th>
                                </tr>
                            </thead>

                            <tbody>
                                {vehicles.map((vehicle) => {
                                    const latestPosition = vehicle.positions[0];

                                    return (
                                        <tr
                                            key={vehicle.id}
                                            className="border-b border-slate-100 last:border-0 dark:border-white/5"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-slate-950 dark:text-white">
                                                    {vehicle.code}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {vehicle.plateNumber ?? "No plate"}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <StatusBadge status={vehicle.type} />
                                            </td>

                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                                {vehicle.currentRoute?.name ?? "Unassigned"}
                                            </td>

                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                                {vehicle.capacity}
                                            </td>

                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                                {latestPosition ? `${latestPosition.speedKmh} km/h` : "-"}
                                            </td>

                                            <td className="px-5 py-4">
                                                <StatusBadge status={vehicle.status} />
                                            </td>

                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                                {latestPosition
                                                    ? `${latestPosition.latitude.toFixed(4)}, ${latestPosition.longitude.toFixed(4)}`
                                                    : "-"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}