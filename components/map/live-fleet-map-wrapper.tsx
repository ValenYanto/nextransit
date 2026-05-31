"use client";

import dynamic from "next/dynamic";

const LiveFleetMap = dynamic(
    () => import("@/components/map/live-fleet-map").then((mod) => mod.LiveFleetMap),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-[520px] items-center justify-center rounded-2xl border border-gray-100 bg-white text-sm text-[#757780] dark:border-white/[0.07] dark:bg-[#0d1f22] text-[#757780]">
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