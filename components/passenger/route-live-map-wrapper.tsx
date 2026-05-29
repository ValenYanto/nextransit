"use client";

import dynamic from "next/dynamic";

import type {
    RouteLiveStop,
    RouteLiveVehicle,
    UserLocation,
    NearestStopSummary,
    RoutePathPoint,
} from "@/components/passenger/route-live-map";

const RouteLiveMap = dynamic(
    () =>
        import("@/components/passenger/route-live-map").then(
            (mod) => mod.RouteLiveMap,
        ),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-[460px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400 md:h-[560px]">
                Loading route map...
            </div>
        ),
    },
);

export function RouteLiveMapWrapper(props: {
    routeName: string;
    stops: RouteLiveStop[];
    pathPoints: RoutePathPoint[];
    vehicles: RouteLiveVehicle[];
    userLocation: UserLocation | null;
    nearestStop: NearestStopSummary;
    isManualLocationMode: boolean;
    selectedVehicleId: string | null;
    selectedStopId: string | null;
    onSelectVehicle: (vehicleId: string) => void;
    onSelectStop: (stopId: string) => void;
    onManualLocationSelect: (location: { latitude: number; longitude: number }) => void;
}) {
    return <RouteLiveMap {...props} />;
}
