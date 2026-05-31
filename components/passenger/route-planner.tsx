"use client";

import { useMemo, useState } from "react";
import { Loader2, Route, Train, Bus, Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";

type StopOption = {
    id: string;
    name: string;
    code: string;
};

type RecommendationResult = {
    totalMinutes: number;
    totalFormatted: string;
    confidence: number;
    trafficLevel: string;
    crowdLevel: string;
    insight: string;
    steps: Array<{
        mode: string;
        title: string;
        description: string;
        minutes: number;
    }>;
};

type RoutePlannerProps = {
    stops: StopOption[];
};

const modeIconMap = {
    FEEDER: Bus,
    TRANSFER: Route,
    MRT: Train,
    LRT: Train,
    BUS: Bus,
};

export function RoutePlanner({ stops }: RoutePlannerProps) {
    const [originStopId, setOriginStopId] = useState(stops[0]?.id ?? "");
    const [destinationStopId, setDestinationStopId] = useState(stops[1]?.id ?? "");
    const [result, setResult] = useState<RecommendationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const destinationOptions = useMemo(
        () => stops.filter((stop) => stop.id !== originStopId),
        [stops, originStopId],
    );

    async function generateRecommendation() {
        setIsLoading(true);

        try {
            const response = await fetch("/api/route-recommendation", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    originStopId,
                    destinationStopId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message ?? "Failed to generate recommendation.");
            }

            setResult(data);
        } catch {
            setResult(null);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <Card className="rounded-2xl border-gray-100 bg-white shadow-none dark:border-white/[0.07] dark:bg-[#0d1f22]">
                <CardContent className="p-5">
                    <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                        Trip planner
                    </h2>
                    <p className="mt-1 text-sm text-[#757780]">
                        Pilih titik awal dan tujuan untuk mendapatkan rekomendasi perjalanan.
                    </p>

                    <div className="mt-5 space-y-4">
                        <div>
                            <label className="text-sm font-medium">Origin</label>
                            <select
                                value={originStopId}
                                onChange={(event) => {
                                    const nextOrigin = event.target.value;
                                    setOriginStopId(nextOrigin);

                                    if (destinationStopId === nextOrigin) {
                                        const fallback = stops.find((stop) => stop.id !== nextOrigin);
                                        setDestinationStopId(fallback?.id ?? "");
                                    }
                                }}
                                className="mt-2 h-11 w-full rounded-xl border border-gray-100 bg-white px-3 text-sm outline-none transition focus:border-[#6CCFF6] dark:border-white/[0.07] dark:bg-[#0d1f22]"
                            >
                                {stops.map((stop) => (
                                    <option key={stop.id} value={stop.id}>
                                        {stop.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Destination</label>
                            <select
                                value={destinationStopId}
                                onChange={(event) => setDestinationStopId(event.target.value)}
                                className="mt-2 h-11 w-full rounded-xl border border-gray-100 bg-white px-3 text-sm outline-none transition focus:border-[#6CCFF6] dark:border-white/[0.07] dark:bg-[#0d1f22]"
                            >
                                {destinationOptions.map((stop) => (
                                    <option key={stop.id} value={stop.id}>
                                        {stop.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Button
                            onClick={generateRecommendation}
                            disabled={isLoading || !originStopId || !destinationStopId}
                            className="h-11 w-full rounded-xl"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                "Generate recommendation"
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-gray-100 bg-white shadow-none dark:border-white/[0.07] dark:bg-[#0d1f22]">
                <CardContent className="p-5">
                    <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                        Recommended route
                    </h2>
                    <p className="mt-1 text-sm text-[#757780]">
                        ETA, crowd, dan koneksi antarmoda akan muncul di sini.
                    </p>

                    {result ? (
                        <div className="mt-5">
                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="rounded-xl bg-[#f9fafb] p-4 dark:bg-white/5">
                                    <Clock3 className="h-4 w-4 text-[#757780]" />
                                    <p className="mt-3 text-xs text-[#757780]">
                                        Total Trip
                                    </p>
                                    <p className="mt-1 font-[var(--font-jakarta)] text-2xl font-semibold">
                                        {result.totalFormatted}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-[#f9fafb] p-4 dark:bg-white/5">
                                    <p className="text-xs text-[#757780]">
                                        Crowd
                                    </p>
                                    <div className="mt-3">
                                        <StatusBadge status={result.crowdLevel} />
                                    </div>
                                </div>

                                <div className="rounded-xl bg-[#f9fafb] p-4 dark:bg-white/5">
                                    <p className="text-xs text-[#757780]">
                                        Confidence
                                    </p>
                                    <p className="mt-1 font-[var(--font-jakarta)] text-2xl font-semibold">
                                        {Math.round(result.confidence * 100)}%
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-3">
                                {result.steps.map((step, index) => {
                                    const Icon =
                                        modeIconMap[step.mode as keyof typeof modeIconMap] ?? Route;

                                    return (
                                        <div
                                            key={`${step.mode}-${index}`}
                                            className="flex gap-4 rounded-xl border border-gray-100 p-4 dark:border-white/[0.07]"
                                        >
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#757780]/10 text-[#757780] dark:bg-white/5 dark:text-[#FFFFFC]">
                                                <Icon className="h-4 w-4" />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="font-medium">{step.title}</p>
                                                        <p className="mt-1 text-sm text-[#757780]">
                                                            {step.description}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm font-medium">{step.minutes} min</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-5 rounded-xl border border-gray-100 p-4 dark:border-white/[0.07]">
                                <p className="text-sm font-medium">AI Insight</p>
                                <p className="mt-1 text-sm text-[#757780]">
                                    {result.insight}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-5 rounded-xl border border-dashed border-gray-100 p-8 text-center text-sm text-[#757780] dark:border-white/[0.07] text-[#757780]">
                            Belum ada rekomendasi. Pilih origin dan destination lalu generate.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
