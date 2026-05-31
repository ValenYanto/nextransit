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
            <div className="flex h-[45vh] max-h-[350px] min-h-[320px] items-center justify-center rounded-2xl bg-white text-sm text-[#757780] dark:bg-[#0a1a1c] md:h-full md:max-h-none md:min-h-0">
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
