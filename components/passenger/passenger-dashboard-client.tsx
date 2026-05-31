"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bus, School, Train, TramFront } from "lucide-react";

import { ModeCard } from "@/components/ui/mode-card";
import { RouteCard } from "@/components/ui/route-card";
import { SearchBar } from "@/components/ui/search-bar";

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

const iconBySlug = {
  transjakarta: Bus,
  "mrt-jakarta": TramFront,
  "lrt-jabodebek": Train,
  "feeder-bus": School,
};

const taglines: Record<string, string> = {
  transjakarta: "Bus Rapid Transit",
  "mrt-jakarta": "Urban rail",
  "lrt-jabodebek": "Light rail",
  "feeder-bus": "First and last mile",
};

export function PassengerDashboardClient({
  modes,
  routes,
}: {
  modes: Mode[];
  routes: PassengerRoute[];
}) {
  const router = useRouter();
  const [selectedModeId, setSelectedModeId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const selectedMode = modes.find((mode) => mode.id === selectedModeId) ?? null;
  const visibleRoutes = useMemo(() => {
    if (!selectedModeId) return [];

    const needle = query.trim().toLowerCase();
    return routes
      .filter((route) => route.modeId === selectedModeId)
      .filter((route) => {
        if (!needle) return true;
        return [route.code, route.name, route.origin, route.destination].some((value) =>
          value.toLowerCase().includes(needle),
        );
      });
  }, [query, routes, selectedModeId]);

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-[#757780]">
          Browse by transport mode
        </p>
        <h2 className="mt-2 text-[22px] font-semibold leading-tight text-[#001011] dark:text-[#FFFFFC]">
          Track one route at a time
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {modes.map((mode) => {
          const Icon = iconBySlug[mode.slug as keyof typeof iconBySlug] ?? Bus;

          return (
            <ModeCard
              key={mode.id}
              mode={{
                name: mode.name,
                tagline: taglines[mode.slug] ?? mode.description ?? "Public transport",
                icon: Icon,
              }}
              liveCount={mode.liveUnitCount}
              isSelected={selectedModeId === mode.id}
              onClick={() => {
                setSelectedModeId(mode.id);
                setQuery("");
              }}
            />
          );
        })}
      </div>

      {selectedMode ? (
        <div className="animate-slide-in space-y-4 rounded-3xl border border-black/10 bg-white p-4 dark:border-white/[0.07] dark:bg-[#0a1a1c]">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-base font-semibold text-[#001011] dark:text-[#FFFFFC]">
                {selectedMode.name} routes
              </p>
              <p className="text-sm text-[#757780]">Search by code, name, or destination.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedModeId(null);
                setQuery("");
              }}
              className="min-h-11 rounded-xl border border-[#6CCFF6] px-4 text-sm font-semibold text-[#6CCFF6] sm:self-start"
            >
              Change mode
            </button>
          </div>

          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search route by name, code, or destination..."
          />

          <div className="space-y-3">
            {visibleRoutes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                buttonLabel="Track"
                onTrack={() => router.push(`/passenger/routes/${route.id}`)}
              />
            ))}
          </div>

          {visibleRoutes.length === 0 ? (
            <div className="rounded-2xl border border-black/10 p-6 text-center text-sm text-[#757780] dark:border-white/[0.07]">
              No route matches this search.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-black/10 bg-white p-5 text-sm text-[#757780] dark:border-white/[0.07] dark:bg-[#0a1a1c]">
          Select TransJakarta, MRT, LRT, or Feeder to show matching routes.
        </div>
      )}
    </section>
  );
}
