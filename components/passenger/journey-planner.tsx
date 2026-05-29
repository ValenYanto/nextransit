"use client";

import { useMemo, useState } from "react";
import {
    AlertCircle,
    CheckCircle2,
    Loader2,
    LocateFixed,
    MapPin,
    Navigation,
    Route,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";

type StopOption = {
    id: string;
    code: string;
    name: string;
    type: string;
    latitude: number;
    longitude: number;
    area: string | null;
};

type JourneyStep = {
    type: "WALK" | "BUS" | "MRT" | "LRT" | "FEEDER" | "TRANSFER";
    title: string;
    description: string;
    from: string;
    to: string;
    route?: {
        id: string;
        code: string;
        name: string;
        mode: string | null;
    };
    etaMinutes: number;
    crowdLevel?: string;
    vehicleSuggestion?: string;
};

type JourneyOption = {
    id: string;
    label: "Fastest" | "Less crowded" | "Fewer transfers";
    totalMinutes: number;
    totalFormatted: string;
    crowdLevel: string;
    transferCount: number;
    recommended: boolean;
    reason: string;
    steps: JourneyStep[];
};

type JourneyResponse = {
    options: JourneyOption[];
    originStop?: StopOption;
    destinationStop?: StopOption;
    message?: string;
};

type UserCoordinate = {
    latitude: number;
    longitude: number;
};

export function JourneyPlanner({ stops }: { stops: StopOption[] }) {
    const [originStopId, setOriginStopId] = useState("");
    const [destinationStopId, setDestinationStopId] = useState("");
    const [userLocation, setUserLocation] = useState<UserCoordinate | null>(null);
    const [isUsingGps, setIsUsingGps] = useState(false);
    const [isPlanning, setIsPlanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<JourneyResponse | null>(null);

    const sortedStops = useMemo(
        () => [...stops].sort((a, b) => a.name.localeCompare(b.name)),
        [stops],
    );

    const requestGps = () => {
        setError(null);

        if (!("geolocation" in navigator)) {
            setError("Browser geolocation is unavailable. Choose an origin stop manually.");
            return;
        }

        setIsUsingGps(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setOriginStopId("");
                setIsUsingGps(false);
            },
            () => {
                setIsUsingGps(false);
                setError("GPS disabled. Choose an origin stop or enable location permission.");
            },
            {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 15000,
            },
        );
    };

    const planJourney = async () => {
        setError(null);
        setResult(null);

        if (!destinationStopId) {
            setError("Choose a destination stop or station.");
            return;
        }

        if (!originStopId && !userLocation) {
            setError("Choose an origin stop or use GPS as your origin.");
            return;
        }

        setIsPlanning(true);
        try {
            const response = await fetch("/api/passenger/journey", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    originStopId: originStopId || undefined,
                    destinationStopId,
                    userLocation: userLocation ?? undefined,
                }),
            });
            const json = (await response.json()) as JourneyResponse;

            if (!response.ok) {
                throw new Error(json.message ?? "Unable to plan this journey.");
            }

            setResult(json);
        } catch (plannerError) {
            setError(
                plannerError instanceof Error
                    ? plannerError.message
                    : "Unable to plan this journey.",
            );
        } finally {
            setIsPlanning(false);
        }
    };

    return (
        <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
            <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">
                            Trip Planner
                        </p>
                        <h2 className="mt-1 font-[var(--font-jakarta)] text-2xl font-semibold tracking-tight">
                            Where are you going?
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Choose where you start and where you want to go. We will suggest
                            the best route, transfer, arrival time, and crowd advice.
                        </p>
                    </div>
                    {result?.options.some((option) => option.recommended) ? (
                        <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            Recommendation ready
                        </span>
                    ) : null}
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                    <label className="space-y-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            From
                        </span>
                        <select
                            value={originStopId}
                            onChange={(event) => {
                                setOriginStopId(event.target.value);
                                if (event.target.value) setUserLocation(null);
                            }}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-cyan-400 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                        >
                            <option value="">
                                {userLocation ? "Using GPS as origin" : "Choose origin stop"}
                            </option>
                            {sortedStops.map((stop) => (
                                <option key={stop.id} value={stop.id}>
                                    {stop.name} ({stop.code})
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="space-y-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            To
                        </span>
                        <select
                            value={destinationStopId}
                            onChange={(event) => setDestinationStopId(event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-cyan-400 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                        >
                            <option value="">Choose destination stop</option>
                            {sortedStops.map((stop) => (
                                <option key={stop.id} value={stop.id}>
                                    {stop.name} ({stop.code})
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="flex flex-col gap-2 lg:pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={requestGps}
                            disabled={isUsingGps}
                            className="h-11 rounded-xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-transparent"
                        >
                            {isUsingGps ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <LocateFixed className="mr-2 h-4 w-4" />
                            )}
                            Use GPS
                        </Button>
                        <Button
                            type="button"
                            onClick={planJourney}
                            disabled={isPlanning}
                            className="h-11 rounded-xl bg-slate-950 text-white shadow-none hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                        >
                            {isPlanning ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Navigation className="mr-2 h-4 w-4" />
                            )}
                            Find best route
                        </Button>
                    </div>
                </div>

                {userLocation ? (
                    <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300">
                        GPS origin captured. NexTransit will use the nearest active stop as
                        your starting point.
                    </div>
                ) : null}

                {error ? (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                ) : null}

                {result ? (
                    <div className="mt-6 space-y-4">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <MapPin className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                            <span>
                                {result.originStop?.name ?? "Origin"} to{" "}
                                {result.destinationStop?.name ?? "destination"}
                            </span>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-3">
                            {result.options.map((option) => (
                                <div
                                    key={option.id}
                                    className={`rounded-2xl border p-4 ${option.recommended
                                        ? "border-cyan-300 bg-cyan-50 dark:border-cyan-400/30 dark:bg-cyan-400/10"
                                        : "border-slate-200 bg-white dark:border-white/10 dark:bg-transparent"
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold">{option.label}</p>
                                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                                {option.reason}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-[var(--font-jakarta)] text-xl font-semibold">
                                                {option.totalFormatted}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {option.transferCount} transfer
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <StatusBadge status={option.crowdLevel} />
                                        {option.recommended ? (
                                            <span className="rounded-full border border-cyan-200 bg-white px-2.5 py-0.5 text-xs text-cyan-700 dark:border-cyan-400/20 dark:bg-white/5 dark:text-cyan-300">
                                                Recommended
                                            </span>
                                        ) : null}
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        {option.steps.map((step, index) => (
                                            <div key={`${option.id}-${index}`} className="flex gap-3">
                                                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold dark:border-white/10 dark:bg-white/5">
                                                    {index + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <StatusBadge status={step.type} />
                                                        <p className="text-sm font-medium">{step.title}</p>
                                                    </div>
                                                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                                        {step.description}
                                                    </p>
                                                    {step.vehicleSuggestion ? (
                                                        <p className="mt-1 text-xs text-cyan-700 dark:text-cyan-300">
                                                            {step.vehicleSuggestion}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <Hint icon={LocateFixed} title="Use GPS" text="Find the closest origin stop." />
                        <Hint icon={Route} title="Transfer smartly" text="Connect feeder, TJ, MRT, and LRT." />
                        <Hint icon={Navigation} title="Board better" text="Compare ETA and crowd levels." />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function Hint({
    icon: Icon,
    title,
    text,
}: {
    icon: typeof LocateFixed;
    title: string;
    text: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
            <Icon className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
            <p className="mt-3 text-sm font-medium">{title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {text}
            </p>
        </div>
    );
}
