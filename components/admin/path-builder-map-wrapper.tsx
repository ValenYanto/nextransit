"use client";

import dynamic from "next/dynamic";

const PathBuilderMap = dynamic(
    () => import("@/components/admin/path-builder-map").then((mod) => mod.PathBuilderMap),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-[460px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400">
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
