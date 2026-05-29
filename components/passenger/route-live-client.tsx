"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
    AlertCircle,
    Clock3,
    Loader2,
    LocateFixed,
    MapPin,
    RefreshCw,
    Route,
    UsersRound,
    Wifi,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { RouteLiveMapWrapper } from "@/components/passenger/route-live-map-wrapper";
import { getDistanceKm } from "@/lib/geo";
import { getBoardingRecommendation } from "@/lib/recommendation/boarding";
import type {
    RouteLiveStop,
    RouteLiveVehicle,
    RoutePathPoint,
    UserLocation,
} from "@/components/passenger/route-live-map";

type LiveRouteResponse = {
    route: {
        id: string;
        code: string;
        name: string;
        type: string;
        origin: string;
        destination: string;
        distanceKm: number;
        pathSource: string | null;
        pathPointCount: number;
        pathUpdatedAt: string | null;
        geometryStatus?: string;
        geometryReason?: string | null;
        maxJumpKm?: number;
    };
    mode: {
        id: string;
        name: string;
        slug: string;
        color: string | null;
        icon: string | null;
    } | null;
    stops: RouteLiveStop[];
    pathPoints: RoutePathPoint[];
    vehicles: RouteLiveVehicle[];
    generatedAt: string;
};

type GpsState = "idle" | "enabled" | "disabled" | "unavailable";
type VehicleDirection = "OUTBOUND" | "INBOUND";

const JAKARTA_FALLBACK: UserLocation = {
    latitude: -6.2008,
    longitude: 106.8229,
    accuracy: 1500,
    source: "fallback",
    updatedAt: new Date(0).toISOString(),
};

export function RouteLiveClient({
    routeId,
    initialData,
}: {
    routeId: string;
    initialData: LiveRouteResponse;
}) {
    const [data, setData] = useState(initialData);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
        initialData.vehicles[0]?.id ?? null,
    );
    const [selectedStopId, setSelectedStopId] = useState<string | null>(
        initialData.stops[0]?.id ?? null,
    );
    const [selectedDirection, setSelectedDirection] = useState<VehicleDirection>("OUTBOUND");
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [gpsState, setGpsState] = useState<GpsState>("idle");
    const [isManualLocationMode, setIsManualLocationMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const gpsWatchIdRef = useRef<number | null>(null);

    const stopGpsWatch = useCallback(() => {
        if (gpsWatchIdRef.current !== null && "geolocation" in navigator) {
            navigator.geolocation.clearWatch(gpsWatchIdRef.current);
            gpsWatchIdRef.current = null;
        }
    }, []);

    const loadLiveData = useCallback(async ({ move = false } = {}) => {
        setIsLoading(true);
        setError(null);

        try {
            if (move) {
                await fetch("/api/simulator/move-vehicles", {
                    method: "POST",
                    cache: "no-store",
                });
            }

            const response = await fetch(`/api/passenger/routes/${routeId}/live`, {
                cache: "no-store",
            });
            const json = (await response.json()) as LiveRouteResponse | { message?: string };

            if (!response.ok) {
                throw new Error("message" in json ? json.message : "Failed to load live route.");
            }

            setData(json as LiveRouteResponse);
        } catch (liveError) {
            setError(liveError instanceof Error ? liveError.message : "Failed to load live route.");
        } finally {
            setIsLoading(false);
        }
    }, [routeId]);

    const enableGps = useCallback(() => {
        if (!("geolocation" in navigator)) {
            setGpsState("unavailable");
            setUserLocation({
                ...JAKARTA_FALLBACK,
                updatedAt: new Date().toISOString(),
            });
            return;
        }

        stopGpsWatch();
        setIsManualLocationMode(false);
        setGpsState("idle");
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setGpsState("enabled");
                setUserLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    source: "gps",
                    updatedAt: new Date(position.timestamp).toISOString(),
                });
            },
            (positionError) => {
                setGpsState("disabled");
                setUserLocation({
                    ...JAKARTA_FALLBACK,
                    updatedAt: new Date().toISOString(),
                });
                if (positionError.code === positionError.PERMISSION_DENIED) {
                    setError("GPS disabled. Use manual location or fallback Jakarta location.");
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 15000,
            },
        );
        gpsWatchIdRef.current = watchId;

        return stopGpsWatch;
    }, [stopGpsWatch]);

    useEffect(() => {
        let cleanup: (() => void) | undefined;
        const timeout = window.setTimeout(() => {
            cleanup = enableGps();
        }, 0);

        return () => {
            window.clearTimeout(timeout);
            cleanup?.();
        };
    }, [enableGps]);

    const handleManualLocationSelect = useCallback((location: { latitude: number; longitude: number }) => {
        stopGpsWatch();
        setGpsState("disabled");
        setIsManualLocationMode(false);
        setError(null);
        setUserLocation({
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: 25,
            source: "manual",
            updatedAt: new Date().toISOString(),
        });
    }, [stopGpsWatch]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            loadLiveData({ move: process.env.NODE_ENV !== "production" });
        }, 12000);

        return () => window.clearInterval(interval);
    }, [loadLiveData]);

    const selectedVehicle = useMemo(() => {
        return (
            data.vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ??
            data.vehicles[0] ??
            null
        );
    }, [data.vehicles, selectedVehicleId]);
    const sortedVehicles = useMemo(() => {
        return [...data.vehicles].sort((a, b) => {
            const aDirectionScore = a.direction === selectedDirection ? 0 : 1;
            const bDirectionScore = b.direction === selectedDirection ? 0 : 1;

            if (aDirectionScore !== bDirectionScore) {
                return aDirectionScore - bDirectionScore;
            }

            return (a.etaToNextStopMinutes ?? 999) - (b.etaToNextStopMinutes ?? 999);
        });
    }, [data.vehicles, selectedDirection]);

    const orderedStops = useMemo(() => {
        return selectedDirection === "INBOUND" ? [...data.stops].reverse() : data.stops;
    }, [data.stops, selectedDirection]);

    const selectedStop = useMemo(() => {
        return (
            data.stops.find((stop) => stop.id === selectedStopId) ??
            data.stops[0] ??
            null
        );
    }, [data.stops, selectedStopId]);

    const nearestStop = useMemo(() => {
        if (!userLocation || data.stops.length === 0) return null;

        const nearest = data.stops.reduce<{
            stop: RouteLiveStop;
            distanceKm: number;
        } | null>((currentNearest, stop) => {
            const distanceKm = getDistanceKm(userLocation, stop);

            if (!currentNearest || distanceKm < currentNearest.distanceKm) {
                return {
                    stop,
                    distanceKm,
                };
            }

            return currentNearest;
        }, null);

        if (!nearest) return null;

        return {
            id: nearest.stop.id,
            name: nearest.stop.name,
            distanceKm: nearest.distanceKm,
        };
    }, [data.stops, userLocation]);

    const transferStops = data.stops.filter((stop) =>
        ["Dukuh Atas", "Bundaran HI", "Lebak Bulus", "Blok M", "Fatmawati"].some(
            (name) => stop.name.includes(name),
        ),
    );
    const outboundLabel = `${data.route.origin} → ${data.route.destination}`;
    const inboundLabel = `${data.route.destination} → ${data.route.origin}`;
    const debugGeometry = process.env.NODE_ENV !== "production";

    return (
        <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-none dark:border-white/10 dark:bg-slate-950">
                        <p className="mb-2 px-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                            Choose direction
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedDirection("OUTBOUND")}
                                className={`rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${selectedDirection === "OUTBOUND"
                                    ? "border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-200"
                                    : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-transparent dark:text-slate-300"
                                    }`}
                            >
                                {outboundLabel}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedDirection("INBOUND")}
                                className={`rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${selectedDirection === "INBOUND"
                                    ? "border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-200"
                                    : "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-transparent dark:text-slate-300"
                                    }`}
                            >
                                {inboundLabel}
                            </button>
                        </div>
                    </div>

                    <RouteLiveMapWrapper
                        routeName={data.route.name}
                        stops={data.stops}
                        pathPoints={data.pathPoints}
                        vehicles={data.vehicles}
                        userLocation={userLocation}
                        nearestStop={nearestStop}
                        isManualLocationMode={isManualLocationMode}
                        selectedVehicleId={selectedVehicle?.id ?? null}
                        selectedStopId={selectedStop?.id ?? null}
                        onSelectVehicle={setSelectedVehicleId}
                        onSelectStop={setSelectedStopId}
                        onManualLocationSelect={handleManualLocationSelect}
                    />

                    <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-medium">Live updates</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Updates every 12 seconds · Last generated{" "}
                                {new Date(data.generatedAt).toLocaleTimeString("id-ID")}
                            </p>
                            {debugGeometry ? (
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                Path: {data.route.pathSource ?? "UNKNOWN"} · {data.route.pathPointCount || data.pathPoints.length} points
                                {typeof data.route.maxJumpKm === "number"
                                    ? ` · max jump ${data.route.maxJumpKm.toFixed(2)} km`
                                    : ""}
                                </p>
                            ) : null}
                            {debugGeometry && data.route.pathSource === "RAIL_MANUAL" ? (
                                <p className="mt-2 text-xs text-cyan-700 dark:text-cyan-300">
                                    Curated rail alignment.
                                </p>
                            ) : null}
                            {debugGeometry && data.route.pathSource === "RAIL_OSM" ? (
                                <p className="mt-2 text-xs text-cyan-700 dark:text-cyan-300">
                                    OSM rail geometry.
                                </p>
                            ) : null}
                            {debugGeometry && data.route.geometryStatus === "invalid" ? (
                                <p className="mt-2 text-xs text-red-600 dark:text-red-300">
                                    Geometry warning: {data.route.geometryReason ?? "invalid route geometry"}
                                </p>
                            ) : null}
                            {debugGeometry && data.route.pathSource === "FALLBACK" ? (
                                <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
                                    This route is using fallback geometry. Rebuild with OSRM for road-following path.
                                </p>
                            ) : null}
                            {debugGeometry && data.route.pathSource === "OSRM" ? (
                                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-300">
                                    Road-following path generated from scheduled stops.
                                </p>
                            ) : null}
                                {userLocation?.source === "gps" && userLocation.accuracy > 500 ? (
                                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
                                        GPS accuracy is low. You can set your location manually.
                                    </p>
                                ) : null}
                                {gpsState === "disabled" && userLocation?.source !== "manual" ? (
                                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
                                        GPS disabled. Use manual location or fallback Jakarta location.
                                    </p>
                                ) : null}
                                {gpsState === "unavailable" ? (
                                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
                                        Browser geolocation is unavailable. Showing fallback location.
                                    </p>
                                ) : null}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {gpsState !== "enabled" ? (
                                    <Button
                                        variant="outline"
                                        className="rounded-xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-transparent"
                                        onClick={enableGps}
                                    >
                                        <LocateFixed className="mr-2 h-4 w-4" />
                                        Enable GPS
                                    </Button>
                                ) : null}
                                <Button
                                    variant={isManualLocationMode ? "default" : "outline"}
                                    className="rounded-xl border-slate-200 shadow-none dark:border-white/10"
                                    onClick={() => setIsManualLocationMode((enabled) => !enabled)}
                                >
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Set location manually
                                </Button>
                                <Button
                                    variant="outline"
                                    className="rounded-xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-transparent"
                                    onClick={() => loadLiveData({ move: true })}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                    )}
                                    Refresh
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <aside className="space-y-4">
                    {error ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                            <AlertCircle className="mb-2 h-4 w-4" />
                            {error}
                        </div>
                    ) : null}

                    <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium">Passenger location</p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        Browser GPS can be inaccurate on desktop. Manual pinning keeps ETA near the route.
                                    </p>
                                </div>
                                <LocateFixed className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <LocationMetric
                                    label="Source"
                                    value={userLocation ? formatLocationSource(userLocation.source) : "Waiting"}
                                />
                                <LocationMetric
                                    label="Accuracy"
                                    value={userLocation ? `${Math.round(userLocation.accuracy)} m` : "-"}
                                />
                                <LocationMetric
                                    label="Nearest stop"
                                    value={nearestStop?.name ?? "-"}
                                />
                                <LocationMetric
                                    label="Distance"
                                    value={nearestStop ? `${nearestStop.distanceKm.toFixed(2)} km` : "-"}
                                />
                            </div>

                            {isManualLocationMode ? (
                                <p className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300">
                                    Click the map to place your location manually.
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium">Vehicles on route</p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {data.vehicles.filter((vehicle) => vehicle.direction === selectedDirection).length} going this way · {data.vehicles.length} total
                                    </p>
                                </div>
                                <Wifi className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                            </div>

                            <div className="mt-5 space-y-3">
                                {sortedVehicles.map((vehicle) => {
                                    const recommendation = getBoardingRecommendation({
                                        crowdLevel: vehicle.crowdLevel,
                                        etaMinutes: vehicle.etaToNextStopMinutes,
                                    });

                                    return (
                                        <button
                                            key={vehicle.id}
                                            onClick={() => setSelectedVehicleId(vehicle.id)}
                                            className={`w-full rounded-xl border p-4 text-left transition ${selectedVehicle?.id === vehicle.id
                                                ? "border-cyan-300 bg-cyan-50 dark:border-cyan-400/30 dark:bg-cyan-400/10"
                                                : "border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:hover:bg-white/5"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-medium">{vehicle.code}</p>
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        {vehicle.directionLabel}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        Next stop: {vehicle.nextStop?.name ?? "Terminal"}
                                                    </p>
                                                </div>
                                                <p className="text-sm font-semibold">
                                                    {vehicle.etaToNextStopFormatted}
                                                </p>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <StatusBadge status={vehicle.crowdLevel} />
                                                <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                                                    Passengers {vehicle.passengerCount}/{vehicle.capacity}
                                                </span>
                                                <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                                                    {vehicle.position.speedKmh} km/h
                                                </span>
                                            </div>
                                            <p className="mt-3 text-xs font-medium text-cyan-700 dark:text-cyan-300">
                                                {recommendation.label}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {selectedVehicle ? (
                        <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                            <CardContent className="p-5">
                                {(() => {
                                    const recommendation = getBoardingRecommendation({
                                        crowdLevel: selectedVehicle.crowdLevel,
                                        etaMinutes: selectedVehicle.etaToNextStopMinutes,
                                    });

                                    return (
                                        <>
                                <p className="text-sm font-medium">Selected vehicle</p>
                                <h2 className="mt-2 font-[var(--font-jakarta)] text-2xl font-semibold">
                                    {selectedVehicle.code}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {selectedVehicle.directionLabel}
                                </p>
                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <Detail icon={Clock3} label="Arrives in" value={selectedVehicle.etaToNextStopFormatted} />
                                    <Detail icon={UsersRound} label="Passengers" value={`${selectedVehicle.passengerCount}/${selectedVehicle.capacity}`} />
                                    <Detail icon={Route} label="Traffic" value={selectedVehicle.trafficLevel} />
                                    <Detail icon={Wifi} label="Confidence" value={`${Math.round(selectedVehicle.confidence * 100)}%`} />
                                </div>
                                <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-800 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200">
                                    <p className="font-medium">{recommendation.label}</p>
                                    <p className="mt-1 text-xs leading-5">{recommendation.description}</p>
                                </div>
                                        </>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    ) : null}
                </aside>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                    <CardContent className="p-5">
                        <h2 className="font-[var(--font-jakarta)] text-xl font-semibold">
                            Stops and next arrivals
                        </h2>
                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                            {orderedStops.map((stop, index) => (
                                <button
                                    key={stop.id}
                                    onClick={() => setSelectedStopId(stop.id)}
                                    className={`rounded-xl border p-4 text-left ${selectedStop?.id === stop.id
                                        ? "border-cyan-300 bg-cyan-50 dark:border-cyan-400/30 dark:bg-cyan-400/10"
                                        : "border-slate-200 bg-white dark:border-white/10 dark:bg-transparent"
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-medium">{index + 1}. {stop.name}</p>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {stop.arrivalTime}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        {stop.area ?? "Jakarta"} · {stop.type}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                    <CardContent className="p-5">
                        <h2 className="font-[var(--font-jakarta)] text-xl font-semibold">
                            Intermodal recommendation
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Use transfer points to combine feeder, TransJakarta, MRT, and LRT
                            services during rush hour. NexTransit prioritizes accurate ETA,
                            passenger density, and headway reliability.
                        </p>
                        <div className="mt-5 space-y-3">
                            {(transferStops.length > 0 ? transferStops : data.stops.slice(0, 2)).map((stop) => (
                                <div
                                    key={stop.id}
                                    className="rounded-xl border border-slate-200 p-4 dark:border-white/10"
                                >
                                    <p className="font-medium">{stop.name}</p>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {stop.name.includes("Dukuh Atas")
                                            ? "Dukuh Atas supports MRT/LRT/TJ transfer."
                                            : `${stop.name} can support route recommendation and schedule coordination.`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                <CardContent className="grid gap-4 p-5 md:grid-cols-4">
                    <LocationMetric label="ETA reliability" value="91%" />
                    <LocationMetric label="Path geometry" value={`${data.pathPoints.length} points`} />
                    <LocationMetric label="Active headway" value={`${Math.max(6, Math.round(18 / Math.max(sortedVehicles.length, 1)))} min`} />
                    <LocationMetric label="Transfer risk" value={transferStops.length > 0 ? "Monitored" : "Low"} />
                </CardContent>
            </Card>
        </div>
    );
}

function Detail({
    icon: Icon,
    label,
    value,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
            <Icon className="h-4 w-4 text-slate-400" />
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-semibold">{value}</p>
        </div>
    );
}

function LocationMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 truncate text-sm font-semibold">{value}</p>
        </div>
    );
}

function formatLocationSource(source: UserLocation["source"]) {
    if (source === "gps") return "GPS";
    if (source === "manual") return "Manual";
    return "Fallback";
}
