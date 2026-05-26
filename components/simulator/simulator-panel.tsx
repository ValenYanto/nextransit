"use client";

import { useState } from "react";
import { CloudRain, Loader2, PartyPopper, Timer, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";

type Scenario = "NORMAL" | "RUSH_HOUR" | "RAIN" | "EVENT";

type SimulationResult = {
    scenario: Scenario;
    summary: string;
    recommendation: string;
    trafficLevel: string;
    crowdLevel: string;
    basePassengerMovement: number;
    predictedPassengerMovement: number;
    adjustedSpeed: number;
    etaFormatted: string;
    recommendedFleet: number;
};

const scenarios: Array<{
    id: Scenario;
    title: string;
    description: string;
}> = [
        {
            id: "NORMAL",
            title: "Normal",
            description: "Kondisi reguler dengan traffic dan crowd rendah.",
        },
        {
            id: "RUSH_HOUR",
            title: "Rush Hour",
            description: "Jam sibuk pagi/sore dengan lonjakan penumpang.",
        },
        {
            id: "RAIN",
            title: "Rain",
            description: "Hujan memperlambat armada dan mengganggu ETA.",
        },
        {
            id: "EVENT",
            title: "Event",
            description: "Event besar meningkatkan kepadatan titik transit.",
        },
    ];

export function SimulatorPanel() {
    const [selectedScenario, setSelectedScenario] = useState<Scenario>("NORMAL");
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    async function runSimulation(scenario: Scenario) {
        setSelectedScenario(scenario);
        setIsLoading(true);

        try {
            const response = await fetch("/api/simulator", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ scenario }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message ?? "Failed to run simulation.");
            }

            setResult(data);
        } catch (error) {
            console.error(error);
            setResult(null);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
            <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                <CardContent className="p-5">
                    <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                        Scenario
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Pilih kondisi operasional untuk melihat dampaknya ke ETA dan kepadatan.
                    </p>

                    <div className="mt-5 space-y-3">
                        {scenarios.map((scenario) => {
                            const isActive = selectedScenario === scenario.id;

                            return (
                                <button
                                    key={scenario.id}
                                    onClick={() => runSimulation(scenario.id)}
                                    className={`w-full rounded-xl border p-4 text-left transition ${isActive
                                            ? "border-cyan-300 bg-cyan-50 dark:border-cyan-400/30 dark:bg-cyan-400/10"
                                            : "border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:hover:bg-white/5"
                                        }`}
                                >
                                    <p className="font-medium">{scenario.title}</p>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {scenario.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                                Simulation result
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Output estimasi untuk kebutuhan armada dan kondisi perjalanan.
                            </p>
                        </div>

                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                    </div>

                    {result ? (
                        <div className="mt-5">
                            <div className="grid gap-3 md:grid-cols-4">
                                <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                                    <Timer className="h-4 w-4 text-slate-400" />
                                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                        ETA
                                    </p>
                                    <p className="mt-1 font-[var(--font-jakarta)] text-xl font-semibold">
                                        {result.etaFormatted}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                                    <UsersRound className="h-4 w-4 text-slate-400" />
                                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                        Passenger
                                    </p>
                                    <p className="mt-1 font-[var(--font-jakarta)] text-xl font-semibold">
                                        {result.predictedPassengerMovement}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                                    <CloudRain className="h-4 w-4 text-slate-400" />
                                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                        Speed
                                    </p>
                                    <p className="mt-1 font-[var(--font-jakarta)] text-xl font-semibold">
                                        {result.adjustedSpeed} km/h
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                                    <PartyPopper className="h-4 w-4 text-slate-400" />
                                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                        Extra Fleet
                                    </p>
                                    <p className="mt-1 font-[var(--font-jakarta)] text-xl font-semibold">
                                        +{result.recommendedFleet}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-2">
                                <StatusBadge status={result.trafficLevel} />
                                <StatusBadge status={result.crowdLevel} />
                                <StatusBadge status={result.scenario} />
                            </div>

                            <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-white/10">
                                <p className="text-sm font-medium">Summary</p>
                                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    {result.summary}
                                </p>
                            </div>

                            <div className="mt-3 rounded-xl border border-slate-200 p-4 dark:border-white/10">
                                <p className="text-sm font-medium">Recommendation</p>
                                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    {result.recommendation}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                            Pilih skenario untuk menjalankan simulasi.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}