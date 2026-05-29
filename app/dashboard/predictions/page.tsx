import { BarChart3, Clock3, Gauge, UsersRound } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { StatusBadge } from "@/components/shared/status-badge";
import {
    calculateEtaMinutes,
    formatEta,
    getEtaConfidence,
} from "@/lib/prediction/eta";
import {
    getDensityDescription,
    getDensityRecommendation,
} from "@/lib/prediction/crowd";

export const dynamic = "force-dynamic";

export default async function PredictionsPage() {
    const [predictions, vehicles, routes] = await Promise.all([
        prisma.crowdPrediction.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                stop: true,
            },
        }),
        prisma.vehicle.findMany({
            include: {
                currentRoute: true,
                positions: {
                    take: 1,
                    orderBy: {
                        recordedAt: "desc",
                    },
                },
            },
        }),
        prisma.route.findMany({
            orderBy: {
                code: "asc",
            },
        }),
    ]);

    const highRiskCount = predictions.filter((prediction) =>
        ["HIGH", "CRITICAL"].includes(prediction.densityLevel),
    ).length;

    const averageConfidence =
        predictions.length > 0
            ? Math.round(
                (predictions.reduce(
                    (sum, prediction) => sum + prediction.confidence,
                    0,
                ) /
                    predictions.length) *
                100,
            )
            : 0;

    const etaSimulations = vehicles.slice(0, 3).map((vehicle) => {
        const route = vehicle.currentRoute ?? routes[0];
        const latestPosition = vehicle.positions[0];
        const speed = latestPosition?.speedKmh ?? 20;

        const trafficLevel = speed >= 30 ? "LOW" : speed >= 15 ? "MEDIUM" : "HIGH";
        const crowdLevel = predictions[0]?.densityLevel ?? "MEDIUM";

        const eta = calculateEtaMinutes({
            distanceKm: route?.distanceKm ?? 6,
            averageSpeedKmh: speed,
            trafficLevel,
            crowdLevel,
        });

        const confidence = getEtaConfidence(trafficLevel, crowdLevel);

        return {
            vehicle,
            route,
            speed,
            trafficLevel,
            crowdLevel,
            eta,
            confidence,
        };
    });

    return (
        <div>
            <PageHeading
                label="Predictions"
                title="ETA and crowd prediction"
                description="Prediksi ETA dan kepadatan penumpang berdasarkan armada, rute, kecepatan, serta data tapping."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Prediction Records"
                    value={predictions.length}
                    description="Latest crowd prediction data"
                    icon={BarChart3}
                />
                <MetricCard
                    title="High Risk Stops"
                    value={highRiskCount}
                    description="High or critical density"
                    icon={UsersRound}
                />
                <MetricCard
                    title="Avg Confidence"
                    value={`${averageConfidence}%`}
                    description="Prediction reliability"
                    icon={Gauge}
                />
                <MetricCard
                    title="ETA Simulations"
                    value={etaSimulations.length}
                    description="Generated from active fleet"
                    icon={Clock3}
                />
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                    <CardContent className="p-5">
                        <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                            ETA simulations
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Estimated arrival time based on distance, speed, traffic, and crowd level.
                        </p>

                        <div className="mt-5 space-y-3">
                            {etaSimulations.map((simulation) => (
                                <div
                                    key={simulation.vehicle.id}
                                    className="rounded-xl border border-slate-200 p-4 dark:border-white/10"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-medium">{simulation.vehicle.code}</p>
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                {simulation.route?.name ?? "Unassigned route"}
                                            </p>
                                        </div>

                                        <p className="font-[var(--font-jakarta)] text-2xl font-semibold">
                                            {formatEta(simulation.eta)}
                                        </p>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <StatusBadge status={simulation.trafficLevel} />
                                        <StatusBadge status={simulation.crowdLevel} />
                                        <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                                            {Math.round(simulation.confidence * 100)}% confidence
                                        </span>
                                        <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                                            {simulation.speed} km/h
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                    <CardContent className="p-5">
                        <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                            Crowd prediction records
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Latest density predictions for stops and stations.
                        </p>

                        <div className="mt-5 space-y-3">
                            {predictions.map((prediction) => (
                                <div
                                    key={prediction.id}
                                    className="rounded-xl border border-slate-200 p-4 dark:border-white/10"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-medium">{prediction.stop.name}</p>
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                {getDensityDescription(prediction.densityLevel)}
                                            </p>
                                        </div>

                                        <StatusBadge status={prediction.densityLevel} />
                                    </div>

                                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Predicted Count
                                            </p>
                                            <p className="mt-1 font-semibold">
                                                {prediction.predictedCount}
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Confidence
                                            </p>
                                            <p className="mt-1 font-semibold">
                                                {Math.round(prediction.confidence * 100)}%
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Action
                                            </p>
                                            <p className="mt-1 text-xs font-medium">
                                                {getDensityRecommendation(prediction.densityLevel)}
                                            </p>
                                        </div>
                                    </div>

                                    {prediction.reason ? (
                                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                                            {prediction.reason}
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
