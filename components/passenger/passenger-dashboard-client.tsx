"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bus, ChevronRight, Route, School, Search, TrainFront, TramFront } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";

type Mode = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    routeCount: number;
    liveUnitCount: number;
};

type PassengerRoute = {
    id: string;
    code: string;
    name: string;
    type: string;
    origin: string;
    destination: string;
    distanceKm: number;
    modeId: string | null;
    modeName: string | null;
    vehicleCount: number;
    stopCount: number;
};

const modeIcons = {
    bus: Bus,
    "train-front": TrainFront,
    "tram-front": TramFront,
    school: School,
};

export function PassengerDashboardClient({
    modes,
    routes,
}: {
    modes: Mode[];
    routes: PassengerRoute[];
}) {
    const [selectedModeId, setSelectedModeId] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    const visibleRoutes = useMemo(() => {
        if (!selectedModeId) return [];

        const normalizedQuery = query.trim().toLowerCase();

        return routes
            .filter((route) => route.modeId === selectedModeId)
            .filter((route) => {
                if (!normalizedQuery) return true;

                return [
                    route.code,
                    route.name,
                    route.origin,
                    route.destination,
                    route.modeName ?? "",
                ].some((value) => value.toLowerCase().includes(normalizedQuery));
            });
    }, [routes, selectedModeId, query]);

    const selectedMode = modes.find((mode) => mode.id === selectedModeId) ?? null;

    return (
        <div className="space-y-6">
            <section>
                <div className="mb-3">
                    <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">
                        Or track a route
                    </p>
                    <h2 className="mt-1 font-[var(--font-jakarta)] text-2xl font-semibold tracking-tight">
                        Choose your transport mode first
                    </h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {modes.map((mode) => {
                    const Icon =
                        modeIcons[mode.icon as keyof typeof modeIcons] ?? Bus;
                    const selected = selectedModeId === mode.id;

                    return (
                        <button
                            key={mode.id}
                            onClick={() => setSelectedModeId(selected ? null : mode.id)}
                            className={`min-h-40 rounded-2xl border p-5 text-left transition ${selected
                                ? "border-cyan-300 bg-cyan-50 dark:border-cyan-400/30 dark:bg-cyan-400/10"
                                : "border-slate-200 bg-white hover:border-cyan-200 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:hover:border-cyan-400/30 dark:hover:bg-white/5"
                                }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-cyan-700 dark:border-white/10 dark:bg-white/5 dark:text-cyan-300">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                                    {mode.routeCount} route
                                </span>
                            </div>
                            <h2 className="mt-4 font-[var(--font-jakarta)] text-lg font-semibold text-slate-950 dark:text-white">
                                {mode.name}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                {mode.description}
                            </p>
                            <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/5">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Live units
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                                    {mode.liveUnitCount} live units
                                </p>
                            </div>
                        </button>
                    );
                })}
                </div>
            </section>

            <section>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">
                            Route tracking
                        </p>
                        <h2 className="mt-1 font-[var(--font-jakarta)] text-2xl font-semibold tracking-tight">
                            {selectedMode ? `${selectedMode.name} routes` : "Select a mode to see routes"}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Pick one mode first so you only see relevant routes.
                        </p>
                    </div>

                    {selectedModeId ? (
                        <Button
                            variant="outline"
                            className="rounded-xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-transparent"
                            onClick={() => {
                                setSelectedModeId(null);
                                setQuery("");
                            }}
                        >
                            Change mode
                        </Button>
                    ) : null}
                </div>

                {selectedModeId ? (
                    <label className="mb-4 flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm dark:border-white/10 dark:bg-slate-950">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search corridor, stop, or destination"
                            className="h-full min-w-0 flex-1 bg-transparent text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
                        />
                    </label>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-2">
                    {visibleRoutes.map((route) => (
                        <Card
                            key={route.id}
                            className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950"
                        >
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <StatusBadge status={route.type} />
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {route.code} · {route.modeName}
                                            </span>
                                        </div>
                                        <h3 className="mt-3 font-[var(--font-jakarta)] text-xl font-semibold">
                                            {route.name}
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            {route.origin} → {route.destination}
                                        </p>
                                    </div>
                                    <Route className="h-5 w-5 text-slate-400" />
                                </div>

                                <div className="mt-5 grid grid-cols-3 gap-3">
                                    <Metric label="Vehicles" value={route.vehicleCount} />
                                    <Metric label="Stops" value={route.stopCount} />
                                    <Metric label="Distance" value={`${route.distanceKm.toFixed(1)} km`} />
                                </div>

                                <Button
                                    asChild
                                    className="mt-5 w-full rounded-xl bg-slate-950 text-white shadow-none hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                                >
                                    <Link href={`/passenger/routes/${route.id}`}>
                                        Track route
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {!selectedModeId ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400">
                        Select TransJakarta, MRT, LRT, or Feeder to show route choices.
                    </div>
                ) : visibleRoutes.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400">
                        No route matches your search for this mode.
                    </div>
                ) : null}
            </section>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                {value}
            </p>
        </div>
    );
}
