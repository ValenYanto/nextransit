"use client";

import dynamic from "next/dynamic";

type LiveVehicle = {
    id: string;
    code: string;
    type: string;
    status: string;
    passengerCount: number;
    capacity: number;
    crowdLevel: string;
    etaFormatted: string;
    distanceToUserKm: number;
    route: {
        name: string;
    } | null;
    position: {
        latitude: number;
        longitude: number;
        speedKmh: number;
    };
};

const PassengerLiveMap = dynamic(
    () =>
        import("@/components/passenger/passenger-live-map").then(
            (mod) => mod.PassengerLiveMap,
        ),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-[520px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400">
                Loading live map...
            </div>
        ),
    },
);

export function PassengerLiveMapWrapper({
    vehicles,
    userLocation,
}: {
    vehicles: LiveVehicle[];
    userLocation: {
        latitude: number;
        longitude: number;
    };
}) {
    return <PassengerLiveMap vehicles={vehicles} userLocation={userLocation} />;
}