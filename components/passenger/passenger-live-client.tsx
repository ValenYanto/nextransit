"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Bus,
    Clock3,
    Loader2,
    Navigation,
    RefreshCw,
    UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PassengerLiveMapWrapper } from "@/components/passenger/passenger-live-map-wrapper";

type LiveVehicle = {
    id: string;
    code: string;
    plateNumber: string | null;
    type: string;
    status: string;
    capacity: number;
    passengerCount: number;
    occupancyRate: number;
    crowdLevel: string;
    route: {
        id: string;
        code: string;
        name: string;
        origin: string;
        destination: string;
        distanceKm: number;
    } | null;
    position: {
        latitude: number;
        longitude: number;
        speedKmh: number;
        heading: number | null;
        recordedAt: string;
    };
    distanceToUserKm: number;
    etaMinutes: number;
    etaFormatted: string;
    trafficLevel: string;
    confidence: number;
};

type LiveTransitResponse = {
    userLocation: {
        latitude: number;
        longitude: number;
    };
    vehicles: LiveVehicle[];
    nearestVehicle: LiveVehicle | null;
    generatedAt: string;
};

export function PassengerLiveClient() {
    const [data, setData] = useState<LiveTransitResponse | null>(null);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(true);

    const loadLiveTransit = useCallback(async () => {
        setIsLoading(true);

        try {
            const response = await fetch("/api/transit/live", {
                cache: "no-store",
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json.message ?? "Failed to load live transit.");
            }

            setData(json);

            setSelectedVehicleId((current) => current ?? json.nearestVehicle?.id ?? null);
        } catch {
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            loadLiveTransit();
        }, 0);

        const interval = window.setInterval(() => {
            loadLiveTransit();
        }, 15000);

        return () => {
            window.clearTimeout(timeout);
            window.clearInterval(interval);
        };
    }, [loadLiveTransit]);

    const selectedVehicle = useMemo(() => {
        if (!data) return null;

        return (
            data.vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ??
            data.nearestVehicle
        );
    }, [data, selectedVehicleId]);

    if (isLoading && !data) {
        return (
            <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-gray-100 bg-white dark:border-white/[0.07] dark:bg-[#0d1f22]">
                <div className="flex items-center gap-2 text-sm text-[#757780]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading nearest transit...
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                Failed to load live transit data.
            </div>
        );
    }

    return (
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
                <PassengerLiveMapWrapper
                    vehicles={data.vehicles}
                    userLocation={data.userLocation}
                />

                <Card className="rounded-2xl border-gray-100 bg-white shadow-none dark:border-white/[0.07] dark:bg-[#0d1f22]">
                    <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-950 dark:text-white">
                                Live tracking
                            </p>
                            <p className="mt-1 text-xs text-[#757780]">
                                Auto-refresh every 15 seconds · Last update{" "}
                                {new Date(data.generatedAt).toLocaleTimeString("id-ID")}
                            </p>
                        </div>

                        <Button
                            variant="outline"
                            onClick={loadLiveTransit}
                            disabled={isLoading}
                            className="rounded-xl border-gray-100 bg-white shadow-none dark:border-white/[0.07] dark:bg-transparent"
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Refresh
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                {selectedVehicle ? (
                    <Card className="rounded-2xl border-gray-100 bg-white shadow-none dark:border-white/[0.07] dark:bg-[#0d1f22]">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm text-[#757780]">
                                        Nearest recommended vehicle
                                    </p>
                                    <h2 className="mt-1 font-[var(--font-jakarta)] text-2xl font-semibold tracking-tight">
                                        {selectedVehicle.code}
                                    </h2>
                                    <p className="mt-1 text-sm text-[#757780]">
                                        {selectedVehicle.route?.name ?? "Unassigned route"}
                                    </p>
                                </div>

                                <StatusBadge status={selectedVehicle.crowdLevel} />
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-[#f9fafb] p-4 dark:bg-white/5">
                                    <Clock3 className="h-4 w-4 text-[#757780]" />
                                    <p className="mt-3 text-xs text-[#757780]">
                                        Arrives in
                                    </p>
                                    <p className="mt-1 font-[var(--font-jakarta)] text-2xl font-semibold">
                                        {selectedVehicle.etaFormatted}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-[#f9fafb] p-4 dark:bg-white/5">
                                    <UsersRound className="h-4 w-4 text-[#757780]" />
                                    <p className="mt-3 text-xs text-[#757780]">
                                        Passenger
                                    </p>
                                    <p className="mt-1 font-[var(--font-jakarta)] text-2xl font-semibold">
                                        {selectedVehicle.passengerCount}/{selectedVehicle.capacity}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-[#f9fafb] p-4 dark:bg-white/5">
                                    <Navigation className="h-4 w-4 text-[#757780]" />
                                    <p className="mt-3 text-xs text-[#757780]">
                                        Distance
                                    </p>
                                    <p className="mt-1 font-[var(--font-jakarta)] text-2xl font-semibold">
                                        {selectedVehicle.distanceToUserKm} km
                                    </p>
                                </div>

                                <div className="rounded-xl bg-[#f9fafb] p-4 dark:bg-white/5">
                                    <Bus className="h-4 w-4 text-[#757780]" />
                                    <p className="mt-3 text-xs text-[#757780]">
                                        Speed
                                    </p>
                                    <p className="mt-1 font-[var(--font-jakarta)] text-2xl font-semibold">
                                        {selectedVehicle.position.speedKmh} km/h
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-2">
                                <StatusBadge status={selectedVehicle.type} />
                                <StatusBadge status={selectedVehicle.status} />
                                <StatusBadge status={selectedVehicle.trafficLevel} />
                                <span className="rounded-full border border-gray-100 px-2.5 py-0.5 text-xs text-[#757780] dark:border-white/[0.07] text-[#757780]">
                                    {Math.round(selectedVehicle.confidence * 100)}% confidence
                                </span>
                            </div>

                            <div className="mt-5 rounded-xl border border-gray-100 p-4 dark:border-white/[0.07]">
                                <p className="text-sm font-medium">Route information</p>
                                <p className="mt-1 text-sm text-[#757780]">
                                    {selectedVehicle.route
                                        ? `${selectedVehicle.route.origin} → ${selectedVehicle.route.destination}`
                                        : "No route assigned"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                <Card className="rounded-2xl border-gray-100 bg-white shadow-none dark:border-white/[0.07] dark:bg-[#0d1f22]">
                    <CardContent className="p-5">
                        <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                            Nearby transit
                        </h2>
                        <p className="mt-1 text-sm text-[#757780]">
                            Sorted by fastest arrival time.
                        </p>

                        <div className="mt-5 space-y-3">
                            {data.vehicles.map((vehicle) => {
                                const isSelected = vehicle.id === selectedVehicle?.id;

                                return (
                                    <button
                                        key={vehicle.id}
                                        onClick={() => setSelectedVehicleId(vehicle.id)}
                                        className={`w-full rounded-xl border p-4 text-left transition ${isSelected
                                            ? "border-cyan-300 bg-cyan-50 dark:border-cyan-400/30 dark:bg-cyan-400/10"
                                            : "border-gray-100 bg-white hover:bg-[#f9fafb] dark:border-white/[0.07] dark:bg-transparent dark:hover:bg-white/5"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="font-medium">{vehicle.code}</p>
                                                <p className="mt-1 text-sm text-[#757780]">
                                                    {vehicle.route?.name ?? "Unassigned route"}
                                                </p>
                                            </div>

                                            <p className="text-sm font-semibold">
                                                {vehicle.etaFormatted}
                                            </p>
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <StatusBadge status={vehicle.crowdLevel} />
                                            <span className="rounded-full border border-gray-100 px-2.5 py-0.5 text-xs text-[#757780] dark:border-white/[0.07] text-[#757780]">
                                                {vehicle.passengerCount}/{vehicle.capacity} passengers
                                            </span>
                                            <span className="rounded-full border border-gray-100 px-2.5 py-0.5 text-xs text-[#757780] dark:border-white/[0.07] text-[#757780]">
                                                {vehicle.distanceToUserKm} km away
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
