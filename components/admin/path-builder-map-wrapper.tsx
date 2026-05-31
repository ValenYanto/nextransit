"use client";

import dynamic from "next/dynamic";

const PathBuilderMap = dynamic(
    () => import("@/components/admin/path-builder-map").then((mod) => mod.PathBuilderMap),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-[50vh] min-h-[360px] items-center justify-center rounded-2xl border border-[#e5e7eb] bg-white text-sm text-[#757780] dark:border-[#1a2f32] dark:bg-[#0d1f22] lg:h-[calc(100vh-150px)] lg:min-h-[720px]">
                Loading builder map...
            </div>
        ),
    },
);

type BuilderRoute = {
    id: string;
    code: string;
    name: string;
    type: string;
    origin: string;
    destination: string;
    pathSource: string | null;
    pathPointCount: number;
    stops: Array<{
        id: string;
        code: string;
        name: string;
        type: string;
        latitude: number;
        longitude: number;
        sequence: number;
    }>;
    pathPoints: Array<{
        latitude: number;
        longitude: number;
        sequence: number;
    }>;
};

export function PathBuilderMapWrapper({ routes }: { routes: BuilderRoute[] }) {
    return <PathBuilderMap routes={routes} />;
}
