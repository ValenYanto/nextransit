"use client";

import dynamic from "next/dynamic";

const LiveFleetMap = dynamic(
    () => import("@/components/map/live-fleet-map").then((mod) => mod.LiveFleetMap),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-[520px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400">
                Loading fleet map...
            </div>
        ),
    },
);

type FleetMarker = {
    id: string;
    code: string;
    type: string;
    status: string;
    routeName: string;
    latitude: number;
    longitude: number;
    speedKmh: number;
};

export function LiveFleetMapWrapper({ markers }: { markers: FleetMarker[] }) {
    return <LiveFleetMap markers={markers} />;
}