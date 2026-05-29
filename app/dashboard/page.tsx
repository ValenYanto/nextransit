import {
    AlertTriangle,
    Bus,
    Clock3,
    MapPinned,
    Route,
    UsersRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { StatusBadge } from "@/components/shared/status-badge";
import { getDensityRecommendation } from "@/lib/prediction/crowd";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const [
        totalVehicles,
        activeVehicles,
        delayedVehicles,
        totalRoutes,
        totalStops,
        crowdedPredictions,
        latestPredictions,
        latestTaps,
    ] = await Promise.all([
        prisma.vehicle.count(),
        prisma.vehicle.count({
            where: {
                status: "ACTIVE",
            },
        }),
        prisma.vehicle.count({
            where: {
                status: "DELAYED",
            },
        }),
        prisma.route.count(),
        prisma.stop.count(),
        prisma.crowdPrediction.count({
            where: {
                densityLevel: {
                    in: ["HIGH", "CRITICAL"],
                },
            },
        }),
        prisma.crowdPrediction.findMany({
            take: 4,
            orderBy: {
                createdAt: "desc",
            },
            include: {
                stop: true,
            },
        }),
        prisma.passengerTap.findMany({
            take: 5,
            orderBy: {
                timestamp: "desc",
            },
            include: {
                stop: true,
            },
        }),
    ]);

    const totalPassengerMovement = latestTaps.reduce(
        (total, tap) => total + tap.countIn + tap.countOut,
        0,
    );

    return (
        <div>
            <PageHeading
                label="Overview"
                title="Transit intelligence overview"
                description="Pantau performa armada, kepadatan halte, dan rekomendasi AI dalam satu dashboard operasional."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Total Fleet"
                    value={totalVehicles}
                    description={`${activeVehicles} active fleet`}
                    icon={Bus}
                />
                <MetricCard
                    title="Delayed Fleet"
                    value={delayedVehicles}
                    description="Fleet requiring attention"
                    icon={AlertTriangle}
                />
                <MetricCard
                    title="Routes"
                    value={totalRoutes}
                    description={`${totalStops} stops registered`}
                    icon={Route}
                />
                <MetricCard
                    title="Crowded Stops"
                    value={crowdedPredictions}
                    description="High or critical density"
                    icon={UsersRound}
                />
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                                    AI operational recommendations
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Generated from latest crowd prediction data.
                                </p>
                            </div>
                            <Clock3 className="h-5 w-5 text-slate-400" />
                        </div>

                        <div className="mt-5 space-y-3">
                            {latestPredictions.length > 0 ? (
                                latestPredictions.map((prediction) => (
                                    <div
                                        key={prediction.id}
                                        className="rounded-xl border border-slate-200 p-4 dark:border-white/10"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="font-medium text-slate-950 dark:text-white">
                                                    {prediction.stop.name}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    {getDensityRecommendation(prediction.densityLevel)}
                                                </p>
                                            </div>

                                            <StatusBadge status={prediction.densityLevel} />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    No prediction data available yet.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                                    Passenger movement
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Latest tap-in and tap-out activity.
                                </p>
                            </div>
                            <MapPinned className="h-5 w-5 text-slate-400" />
                        </div>

                        <div className="mt-6">
                            <p className="font-[var(--font-jakarta)] text-4xl font-semibold tracking-tight">
                                {totalPassengerMovement}
                            </p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                recent passenger movements
                            </p>
                        </div>

                        <div className="mt-5 space-y-3">
                            {latestTaps.map((tap) => (
                                <div
                                    key={tap.id}
                                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-white/5"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{tap.stop.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            In {tap.countIn} · Out {tap.countOut}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold">
                                        {tap.countIn + tap.countOut}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
