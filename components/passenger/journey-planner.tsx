"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CircleDot, Loader2, LocateFixed, MapPin, RefreshCw } from "lucide-react";

import { CrowdBadge } from "@/components/ui/crowd-badge";

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

  const sortedStops = useMemo(() => [...stops].sort((a, b) => a.name.localeCompare(b.name)), [stops]);

  function swapStops() {
    setOriginStopId(destinationStopId);
    setDestinationStopId(originStopId);
    setUserLocation(null);
  }

  function requestGps() {
    setError(null);

    if (!("geolocation" in navigator)) {
      setError("Location is not available. Choose a stop manually.");
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
        setError("Location is off. Choose a starting stop manually.");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  }

  async function planJourney() {
    setError(null);
    setResult(null);

    if (!destinationStopId) {
      setError("Choose where you want to go.");
      return;
    }

    if (!originStopId && !userLocation) {
      setError("Choose where you start or use your location.");
      return;
    }

    setIsPlanning(true);
    try {
      const response = await fetch("/api/passenger/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originStopId: originStopId || undefined,
          destinationStopId,
          userLocation: userLocation ?? undefined,
        }),
      });
      const json = (await response.json()) as JourneyResponse;

      if (!response.ok) {
        throw new Error(json.message ?? "Unable to find a route.");
      }

      setResult(json);
    } catch {
      setError("Unable to find a route. Try another stop.");
    } finally {
      setIsPlanning(false);
    }
  }

  return (
    <section className="mx-auto max-w-[600px] rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-[#0a1a1c]">
      <h2 className="text-lg font-semibold">Plan your journey</h2>
      <p className="mt-1 text-sm text-[#757780]">Where would you like to go?</p>

      <div className="mt-5 space-y-3">
        <div className="rounded-2xl border border-black/10 p-3 dark:border-white/[0.07]">
          <div className="flex items-center gap-3">
            <CircleDot className="h-5 w-5 shrink-0 text-[#10B981]" />
            <select
              value={originStopId}
              onChange={(event) => {
                setOriginStopId(event.target.value);
                if (event.target.value) setUserLocation(null);
              }}
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[#001011] outline-none dark:text-[#FFFFFC]"
            >
              <option value="">{userLocation ? "Using current location" : "From — Current location or type a stop"}</option>
              {sortedStops.map((stop) => (
                <option key={stop.id} value={stop.id}>
                  {stop.name} ({stop.code})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={requestGps}
              disabled={isUsingGps}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6CCFF6]/10 text-[#6CCFF6]"
              aria-label="Use current location"
            >
              {isUsingGps ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={swapStops}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#6CCFF6]/30 text-[#6CCFF6]"
            aria-label="Swap stops"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-black/10 p-3 dark:border-white/[0.07]">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 shrink-0 text-[#6CCFF6]" />
            <select
              value={destinationStopId}
              onChange={(event) => setDestinationStopId(event.target.value)}
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[#001011] outline-none dark:text-[#FFFFFC]"
            >
              <option value="">To — Destination stop or area</option>
              {sortedStops.map((stop) => (
                <option key={stop.id} value={stop.id}>
                  {stop.name} ({stop.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={planJourney}
          disabled={isPlanning}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#6CCFF6] px-6 font-semibold text-[#001011] disabled:opacity-60"
        >
          {isPlanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Find Best Route
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-[#757780]/10 p-3 text-sm text-[#757780]">{error}</p> : null}

      {result ? (
        <div className="mt-6 space-y-3">
          {result.options.slice(0, 3).map((option) => (
            <article
              key={option.id}
              className={`rounded-2xl border p-4 ${
                option.recommended ? "border-[#6CCFF6] bg-[#6CCFF6]/10" : "border-black/10 dark:border-white/[0.07]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{option.label} route</p>
                  <p className="mt-1 text-sm text-[#757780]">{option.reason}</p>
                </div>
                <p className="text-lg font-bold">{option.totalFormatted}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <CrowdBadge level={toCrowd(option.crowdLevel)} />
                <span className="rounded-full bg-[#757780]/10 px-3 py-1 text-xs font-semibold text-[#757780]">
                  {option.transferCount} transfer
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {option.steps.map((step, index) => (
                  <div key={`${option.id}-${index}`} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6CCFF6]/10 text-xs font-semibold text-[#6CCFF6]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs leading-5 text-[#757780]">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function toCrowd(level: string): "low" | "moderate" | "high" {
  const normalized = level.toUpperCase();
  if (normalized === "LOW") return "low";
  if (normalized === "MEDIUM") return "moderate";
  return "high";
}
