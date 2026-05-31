"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Clock3, Loader2, LocateFixed, MapPin, RefreshCw, UsersRound, X } from "lucide-react";

import { BoardingAdvice } from "@/components/ui/boarding-advice";
import { CrowdBadge } from "@/components/ui/crowd-badge";
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
  stopETAs: StopETA[];
  generatedAt: string;
};

type StopETA = {
  stopId: string;
  stopName: string;
  vehicles: Array<{
    vehicleId: string;
    vehicleCode: string;
    direction: VehicleDirection;
    etaMinutes: number;
    etaLabel: string;
    nextStopName: string;
    occupancy: number;
    capacity: number;
    crowdLevel: "LOW" | "MODERATE" | "HIGH";
  }>;
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
  const [selectedDirection, setSelectedDirection] = useState<VehicleDirection>("OUTBOUND");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(initialData.stops[0]?.id ?? null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [gpsState, setGpsState] = useState<GpsState>("idle");
  const [isManualLocationMode, setIsManualLocationMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [friendlyError, setFriendlyError] = useState<string | null>(null);
  const gpsWatchIdRef = useRef<number | null>(null);

  const stopGpsWatch = useCallback(() => {
    if (gpsWatchIdRef.current !== null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      gpsWatchIdRef.current = null;
    }
  }, []);

  const loadLiveData = useCallback(async ({ move = false } = {}) => {
    setIsLoading(true);
    setFriendlyError(null);

    try {
      if (move) {
        await fetch("/api/simulator/move-vehicles", { method: "POST", cache: "no-store" });
      }

      const response = await fetch(`/api/passenger/routes/${routeId}/live`, { cache: "no-store" });
      const json = (await response.json()) as LiveRouteResponse | { message?: string };

      if (!response.ok) {
        throw new Error("message" in json ? json.message : "Unable to refresh live data.");
      }

      setData(json as LiveRouteResponse);
    } catch {
      setFriendlyError("Live data could not be refreshed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [routeId]);

  const enableGps = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGpsState("unavailable");
      setUserLocation({ ...JAKARTA_FALLBACK, updatedAt: new Date().toISOString() });
      return;
    }

    stopGpsWatch();
    setIsManualLocationMode(false);

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
      () => {
        setGpsState("disabled");
        setUserLocation({ ...JAKARTA_FALLBACK, updatedAt: new Date().toISOString() });
        setFriendlyError("Location is off. You can pin your location manually on the map.");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    gpsWatchIdRef.current = watchId;
  }, [stopGpsWatch]);

  useEffect(() => {
    const timeout = window.setTimeout(enableGps, 0);
    return () => {
      window.clearTimeout(timeout);
      stopGpsWatch();
    };
  }, [enableGps, stopGpsWatch]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadLiveData({ move: process.env.NODE_ENV !== "production" });
    }, 12000);

    return () => window.clearInterval(interval);
  }, [loadLiveData]);

  const directionVehicles = useMemo(
    () => data.vehicles.filter((vehicle) => vehicle.direction === selectedDirection),
    [data.vehicles, selectedDirection],
  );
  const selectedVehicle = useMemo(() => {
    return directionVehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null;
  }, [directionVehicles, selectedVehicleId]);
  const sortedVehicles = useMemo(() => {
    return [...directionVehicles].sort(
      (a, b) => (a.etaToNextStopMinutes ?? 999) - (b.etaToNextStopMinutes ?? 999),
    );
  }, [directionVehicles]);
  const orderedStops = useMemo(
    () => (selectedDirection === "INBOUND" ? [...data.stops].reverse() : data.stops),
    [data.stops, selectedDirection],
  );
  const nearestStop = useMemo(() => {
    if (!userLocation || data.stops.length === 0) return null;
    const nearest = data.stops.reduce<{ stop: RouteLiveStop; distanceKm: number } | null>(
      (current, stop) => {
        const distanceKm = getDistanceKm(userLocation, stop);
        if (!current || distanceKm < current.distanceKm) return { stop, distanceKm };
        return current;
      },
      null,
    );
    return nearest ? { id: nearest.stop.id, name: nearest.stop.name, distanceKm: nearest.distanceKm } : null;
  }, [data.stops, userLocation]);
  const transferStops = data.stops.filter((stop) =>
    ["Dukuh Atas", "Bundaran HI", "Lebak Bulus", "Blok M", "Fatmawati", "Harmoni"].some((name) =>
      stop.name.includes(name),
    ),
  );

  const outboundLabel = `${data.route.origin} → ${data.route.destination}`;
  const inboundLabel = `${data.route.destination} → ${data.route.origin}`;

  function handleManualLocationSelect(location: { latitude: number; longitude: number }) {
    stopGpsWatch();
    setGpsState("disabled");
    setIsManualLocationMode(false);
    setFriendlyError(null);
    setUserLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: 25,
      source: "manual",
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-gray-100 bg-white px-4 py-3 dark:border-white/[0.07] dark:bg-[#0d1f22]">
        <div className="flex items-start gap-3">
          <div>
            <div className="mb-0.5 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-[#6CCFF6]/10 px-2.5 py-0.5 font-mono text-xs font-bold text-[#6CCFF6]">
                {data.route.code}
              </span>
              <span className="rounded-full bg-[#10B981]/10 px-2.5 py-0.5 text-xs font-semibold text-[#10B981]">
                {data.mode?.name ?? data.route.type}
              </span>
            </div>
            <h1 className="text-base font-bold text-[#001011] dark:text-[#FFFFFC]">
              {data.route.name}
            </h1>
            <p className="mt-0.5 text-xs text-[#757780]">
              {data.stops.length} stops · {data.vehicles.length} live units · see arrival time, passengers, crowd, and boarding advice.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-[#757780]/10 p-1">
        <div className="grid grid-cols-2 gap-1">
          <DirectionButton
            active={selectedDirection === "OUTBOUND"}
            label={`→ ${data.route.destination}`}
            detail={outboundLabel}
            onClick={() => {
              setSelectedDirection("OUTBOUND");
              setSelectedVehicleId(null);
            }}
          />
          <DirectionButton
            active={selectedDirection === "INBOUND"}
            label={`← ${data.route.origin}`}
            detail={inboundLabel}
            onClick={() => {
              setSelectedDirection("INBOUND");
              setSelectedVehicleId(null);
            }}
          />
        </div>
      </section>

      <div className="grid gap-4 md:h-[calc(100vh-190px)] md:grid-cols-[380px_1fr]">
        <aside className="order-2 min-h-0 space-y-4 overflow-y-auto md:order-1">
          {isManualLocationMode ? (
            <p className="rounded-2xl border border-[#6CCFF6]/30 bg-[#6CCFF6]/10 p-3 text-sm text-[#757780]">
              Click the map to pin your location.
            </p>
          ) : null}
          {friendlyError ? (
            <p className="rounded-2xl border border-[#757780]/30 bg-[#757780]/10 p-3 text-sm text-[#757780]">
              {friendlyError}
            </p>
          ) : null}
          {gpsState === "unavailable" ? (
            <p className="rounded-2xl border border-[#757780]/30 bg-[#757780]/10 p-3 text-sm text-[#757780]">
              Location is unavailable in this browser. You can still pin your location manually.
            </p>
          ) : null}
          {userLocation?.source === "gps" && userLocation.accuracy > 500 ? (
            <p className="rounded-2xl border border-[#757780]/30 bg-[#757780]/10 p-3 text-sm text-[#757780]">
              Your location accuracy is low. Pin your location manually for a better arrival estimate.
            </p>
          ) : null}

          {selectedVehicle ? (
            <SelectedVehiclePanel vehicle={selectedVehicle} onClose={() => setSelectedVehicleId(null)} />
          ) : null}

          <section className="rounded-3xl border border-black/10 bg-white p-4 dark:border-white/[0.07] dark:bg-[#0d1f22]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-medium">Vehicles on this route</h2>
                <p className="text-sm text-[#757780]">{directionVehicles.length} going this way</p>
              </div>
              <button
                type="button"
                onClick={() => loadLiveData({ move: true })}
                disabled={isLoading}
                className="min-h-10 rounded-xl border border-[#6CCFF6] px-3 text-sm font-semibold text-[#6CCFF6]"
              >
                {isLoading ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 inline h-4 w-4" />}
                Refresh
              </button>
            </div>

            <div className="space-y-3">
              {sortedVehicles.map((vehicle) => (
                <VehicleRow
                  key={vehicle.id}
                  vehicle={vehicle}
                  active={selectedVehicleId === vehicle.id}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                />
              ))}
              {sortedVehicles.length === 0 ? (
                <p className="rounded-2xl border border-[#757780]/30 p-4 text-sm text-[#757780]">
                  No vehicles currently on this route.
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-black/10 bg-white p-4 dark:border-white/[0.07] dark:bg-[#0d1f22]">
            <h2 className="px-1 text-sm font-semibold text-[#001011] dark:text-[#FFFFFC]">Stops on this route</h2>
            <div className="mt-4 space-y-0">
              {orderedStops.map((stop, index) => {
                const distance = userLocation ? getDistanceKm(userLocation, stop) : null;
                const isNearest = nearestStop?.name === stop.name;
                const stopETA = data.stopETAs.find((eta) => eta.stopId === stop.id);
                const stopVehicles = (stopETA?.vehicles ?? []).filter((vehicle) => vehicle.direction === selectedDirection);
                const isFirst = index === 0;
                const isLast = index === orderedStops.length - 1;
                return (
                  <div key={stop.id} className="flex gap-0">
                    <div className="relative flex w-8 shrink-0 flex-col items-center">
                      {!isFirst ? <div className="h-4 w-0.5 shrink-0 bg-gray-200 dark:bg-white/10" /> : null}
                      <div
                        className={`z-10 h-3 w-3 shrink-0 rounded-full border-2 ${
                          isNearest
                            ? "bg-[#6CCFF6] border-[#6CCFF6] ring-4 ring-[#6CCFF6]/20"
                            : "border-gray-300 bg-white dark:border-white/20 dark:bg-[#0d1f22]"
                        }`}
                      />
                      {!isLast ? <div className="min-h-10 w-0.5 flex-1 bg-gray-200 dark:bg-white/10" /> : null}
                    </div>

                    <div className={`ml-3 flex-1 ${isNearest ? "pb-3" : "pb-1"}`}>
                      <button
                        type="button"
                        onClick={() => setSelectedStopId(stop.id)}
                        className={`w-full rounded-xl px-3 py-2 text-left ${
                          isNearest ? "bg-[#6CCFF6]/10" : ""
                        }`}
                      >
                        <p className="text-sm font-medium text-[#001011] dark:text-[#FFFFFC]">
                          {stop.name}
                          {isNearest ? (
                            <span className="ml-2 rounded-full bg-[#6CCFF6]/10 px-2 py-0.5 text-[10px] font-semibold text-[#6CCFF6]">
                              Nearest
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-xs text-[#757780]">
                          {distance ? `${distance.toFixed(2)} km from you` : stop.area ?? "Jakarta"}
                        </p>
                      </button>

                      <div className="mx-3 mb-2 space-y-1.5">
                        {stopVehicles.slice(0, 2).map((vehicle) => (
                          <div
                            key={vehicle.vehicleId}
                            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 dark:border-white/[0.07] dark:bg-[#0d1f22]"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#001011] text-base dark:bg-white/5">
                              <span>{data.route.type === "MRT" ? "🚇" : data.route.type === "LRT" ? "🚈" : data.route.type === "FEEDER" ? "🚐" : "🚌"}</span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="shrink-0 rounded-md bg-[#EF4444] px-2 py-0.5 text-[10px] font-bold text-white">
                                  {vehicle.vehicleCode}
                                </span>
                                <span className="shrink-0 text-[11px] text-[#757780]">→</span>
                                <span className="truncate text-[11px] font-medium text-[#001011] dark:text-[#FFFFFC]">
                                  {vehicle.nextStopName}
                                </span>
                              </div>
                              <p className="mt-0.5 text-[10px] text-[#757780]">Tujuan Akhir</p>
                            </div>

                            <div className="ml-1 shrink-0 text-right">
                              <p className="whitespace-nowrap text-[10px] text-[#757780]">Perkiraan Kedatangan</p>
                              <p className={`text-sm font-bold leading-tight ${getEtaTone(vehicle.etaMinutes)}`}>
                                {vehicle.etaLabel}
                              </p>
                            </div>
                          </div>
                        ))}

                        {stopVehicles.length === 0 ? (
                          <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-white/[0.02]">
                            <p className="text-xs text-[#757780]">No vehicle approaching</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {transferStops.length > 0 ? (
            <section className="rounded-3xl border border-black/10 bg-white p-4 dark:border-white/[0.07] dark:bg-[#0d1f22]">
              <h2 className="text-[15px] font-medium">Connections available</h2>
              <div className="mt-4 space-y-2">
                {transferStops.map((stop) => (
                  <div key={stop.id} className="rounded-2xl border border-black/10 p-3 dark:border-white/[0.07]">
                    <p className="font-medium">{stop.name}</p>
                    <p className="mt-1 text-sm text-[#757780]">Transfer to another transport mode nearby.</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </aside>

        <section className="relative order-1 min-h-[45vh] md:order-2 md:min-h-0">
          <RouteLiveMapWrapper
            routeName={data.route.name}
            stops={data.stops}
            pathPoints={data.pathPoints}
            vehicles={directionVehicles}
            userLocation={userLocation}
            nearestStop={nearestStop}
            isManualLocationMode={isManualLocationMode}
            selectedVehicleId={selectedVehicle?.id ?? null}
            selectedStopId={selectedStopId}
            onSelectVehicle={setSelectedVehicleId}
            onSelectStop={setSelectedStopId}
            onManualLocationSelect={handleManualLocationSelect}
          />
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={enableGps}
              className="min-h-11 rounded-xl bg-[#001011] px-4 text-sm font-semibold text-[#FFFFFC] dark:bg-[#FFFFFC] dark:text-[#001011]"
            >
              <LocateFixed className="mr-2 inline h-4 w-4" />
              Use my location
            </button>
            <button
              type="button"
              onClick={() => setIsManualLocationMode((enabled) => !enabled)}
              className="min-h-11 rounded-xl bg-white px-4 text-sm font-semibold text-[#001011] dark:bg-[#0a1a1c] dark:text-[#FFFFFC]"
            >
              <MapPin className="mr-2 inline h-4 w-4" />
              Pin on map
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function DirectionButton({
  active,
  label,
  detail,
  onClick,
}: {
  active: boolean;
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-14 rounded-xl px-3 text-left ${
        active
          ? "bg-white text-[#001011] shadow-sm dark:bg-[#0a1a1c] dark:text-[#FFFFFC]"
          : "text-[#757780]"
      }`}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className="block truncate text-[11px] text-[#757780]">{detail}</span>
    </button>
  );
}

function VehicleRow({
  vehicle,
  active,
  onClick,
}: {
  vehicle: RouteLiveVehicle;
  active: boolean;
  onClick: () => void;
}) {
  const recommendation = getBoardingRecommendation({
    crowdLevel: vehicle.crowdLevel,
    etaMinutes: vehicle.etaToNextStopMinutes,
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left ${
        active
          ? "border-[#6CCFF6] bg-[#6CCFF6]/10"
          : "border-black/10 bg-white dark:border-white/[0.07] dark:bg-[#001011]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{vehicle.code}</p>
          <p className="mt-1 text-sm text-[#757780]">Next stop: {vehicle.nextStop?.name ?? "Terminal"}</p>
        </div>
        <p className="text-sm font-semibold text-[#6CCFF6]">{vehicle.etaToNextStopFormatted}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <CrowdBadge level={toCrowdLevel(vehicle.crowdLevel)} />
        <span className="rounded-full bg-[#757780]/10 px-3 py-1 text-xs font-semibold text-[#757780]">
          {vehicle.passengerCount}/{vehicle.capacity} passengers
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold text-[#10B981]">{recommendation.label}</p>
    </button>
  );
}

function SelectedVehiclePanel({
  vehicle,
  onClose,
}: {
  vehicle: RouteLiveVehicle;
  onClose: () => void;
}) {
  const recommendation = getBoardingRecommendation({
    crowdLevel: vehicle.crowdLevel,
    etaMinutes: vehicle.etaToNextStopMinutes,
  });

  return (
    <section className="animate-slide-in rounded-t-3xl border border-black/10 bg-white p-5 shadow-[0_-4px_24px_rgba(0,16,17,0.15)] dark:border-white/[0.07] dark:bg-[#0a1a1c]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[#757780]">Selected vehicle</p>
          <h2 className="mt-1 text-xl font-semibold">{vehicle.code}</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-[#757780]">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5">
        <p className="text-[28px] font-bold leading-tight">Arrives in {vehicle.etaToNextStopFormatted}</p>
        <p className="mt-1 text-sm text-[#757780]">Next stop: {vehicle.nextStop?.name ?? "Terminal"}</p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Stat icon={<UsersRound className="h-4 w-4" />} label="Passengers" value={`${vehicle.passengerCount}/${vehicle.capacity}`} />
        <Stat label="Crowd" value={titleCase(vehicle.crowdLevel)} />
        <Stat icon={<Clock3 className="h-4 w-4" />} label="Speed" value={`${vehicle.position.speedKmh} km/h`} />
      </div>

      <div className="mt-4">
        <BoardingAdvice advice={toAdvice(recommendation.severity)} />
      </div>
    </section>
  );
}

function Stat({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#757780]/10 p-3">
      {icon ? <div className="text-[#6CCFF6]">{icon}</div> : null}
      <p className="mt-2 text-[11px] text-[#757780]">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function toCrowdLevel(level: string): "low" | "moderate" | "high" {
  const normalized = level.toUpperCase();
  if (normalized === "LOW") return "low";
  if (normalized === "MEDIUM") return "moderate";
  return "high";
}

function toAdvice(severity: string): "board" | "urgent" | "wait" {
  if (severity === "LOW" || severity === "MEDIUM") return "board";
  if (severity === "HIGH") return "urgent";
  return "wait";
}

function getEtaTone(etaMinutes: number) {
  if (etaMinutes <= 3) return "text-[#10B981]";
  if (etaMinutes <= 8) return "text-[#F59E0B]";
  return "text-[#001011] dark:text-[#FFFFFC]";
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
