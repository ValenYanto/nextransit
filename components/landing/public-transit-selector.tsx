"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bus, MapPin, School, Train, TramFront } from "lucide-react";

import { ModeCard } from "@/components/ui/mode-card";
import { RouteCard } from "@/components/ui/route-card";
import { SearchBar } from "@/components/ui/search-bar";

type LandingMode = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  routeCount: number;
  liveUnitCount: number;
};

type PassengerRoute = {
  id: string;
  code: string;
  name: string;
  origin: string;
  destination: string;
  vehicleCount: number;
  stopCount: number;
};

type RoutesResponse = {
  routes: PassengerRoute[];
  message?: string;
};

const iconBySlug = {
  transjakarta: Bus,
  "mrt-jakarta": TramFront,
  "lrt-jabodebek": Train,
  "feeder-bus": School,
};

const modeTaglines: Record<string, string> = {
  transjakarta: "Bus Rapid Transit",
  "mrt-jakarta": "Urban rail",
  "lrt-jabodebek": "Light rail",
  "feeder-bus": "First and last mile",
};

export function PublicTransitSelector({
  modes,
  isAuthenticated,
}: {
  modes: LandingMode[];
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [selectedModeId, setSelectedModeId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [routes, setRoutes] = useState<PassengerRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedModeId) return;

    const controller = new AbortController();

    async function loadRoutes() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/passenger/routes?modeId=${selectedModeId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = (await response.json()) as RoutesResponse;

        if (!response.ok) {
          throw new Error(json.message ?? "Unable to load routes.");
        }

        setRoutes(json.routes);
      } catch (routeError) {
        if (routeError instanceof DOMException && routeError.name === "AbortError") return;
        setError(routeError instanceof Error ? routeError.message : "Unable to load routes.");
      } finally {
        setIsLoading(false);
      }
    }

    loadRoutes();

    return () => controller.abort();
  }, [selectedModeId]);

  const selectedMode = modes.find((mode) => mode.id === selectedModeId) ?? null;
  const filteredRoutes = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return routes;

    return routes.filter((route) =>
      [route.code, route.name, route.origin, route.destination].some((value) =>
        value.toLowerCase().includes(needle),
      ),
    );
  }, [query, routes]);

  function trackRoute(routeId: string) {
    const livePath = `/passenger/routes/${routeId}`;
    router.push(isAuthenticated ? livePath : `/login?callbackUrl=${encodeURIComponent(livePath)}`);
  }

  return (
    <section className="mx-auto w-full max-w-[900px] space-y-4">
      <p className="text-xs font-medium uppercase tracking-widest text-[#757780]">
        Select transport mode
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {modes.map((mode) => {
          const Icon = iconBySlug[mode.slug as keyof typeof iconBySlug] ?? Bus;

          return (
            <ModeCard
              key={mode.id}
              mode={{
                name: mode.name,
                tagline: modeTaglines[mode.slug] ?? mode.description ?? "Public transport",
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
          <div>
            <p className="text-sm font-medium text-[#001011] dark:text-[#FFFFFC]">
              Routes for {selectedMode.name}
            </p>
            <p className="mt-1 text-sm text-[#757780]">
              Search by route name, code, or destination.
            </p>
          </div>

          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by route name, code, or destination..."
          />

          {error ? (
            <p className="rounded-2xl border border-[#757780]/30 bg-[#757780]/10 p-3 text-sm text-[#757780]">
              {error}
            </p>
          ) : null}

          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-2xl bg-[#757780]/10"
                />
              ))}
            </div>
          ) : filteredRoutes.length > 0 ? (
            <div className="space-y-3">
              {filteredRoutes.map((route) => (
                <RouteCard key={route.id} route={route} onTrack={() => trackRoute(route.id)} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-black/10 p-8 text-center dark:border-white/[0.07]">
              <MapPin className="mx-auto h-8 w-8 text-[#757780]" />
              <p className="mt-3 font-medium text-[#001011] dark:text-[#FFFFFC]">
                No routes found
              </p>
              <p className="mt-1 text-sm text-[#757780]">
                Try a different search or select another mode.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
