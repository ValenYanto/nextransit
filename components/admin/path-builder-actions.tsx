"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";

type SegmentReport = {
    from: string;
    to: string;
    source: string;
    pointCount: number;
    distanceMeters?: number;
    durationSeconds?: number;
    error?: string;
};

type RebuildReport = {
    routeCode: string;
    source: string;
    pathPointCount: number;
    segmentReports: SegmentReport[];
    message?: string;
};

export function PathBuilderActions({
    routeId,
    routeType,
}: {
    routeId: string;
    routeType: string;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<RebuildReport | null>(null);
    const [error, setError] = useState<string | null>(null);

    const rebuildPath = async () => {
        setIsLoading(true);
        setError(null);
        setReport(null);

        try {
            const response = await fetch(`/api/admin/routes/${routeId}/rebuild-path`, {
                method: "POST",
            });
            const json = (await response.json()) as RebuildReport;

            if (!response.ok) {
                throw new Error(json.message ?? "Failed to rebuild route path.");
            }

            setReport(json);
        } catch (rebuildError) {
            setError(
                rebuildError instanceof Error
                    ? rebuildError.message
                    : "Failed to rebuild route path.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-3">
            <Button
                type="button"
                onClick={rebuildPath}
                disabled={isLoading}
                className="rounded-xl bg-slate-950 text-white shadow-none dark:bg-white dark:text-slate-950"
            >
                {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {routeType === "MRT" || routeType === "LRT"
                    ? "Rebuild rail path"
                    : "Rebuild road path"}
            </Button>

            {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                    {error}
                </p>
            ) : null}

            {report ? (
                <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={report.source} />
                        <span className="text-sm font-medium">
                            {report.routeCode}: {report.pathPointCount} path points
                        </span>
                    </div>
                    <div className="mt-3 space-y-2">
                        {report.segmentReports.map((segment) => (
                            <div
                                key={`${segment.from}-${segment.to}`}
                                className="rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-white/5"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-medium">
                                        {segment.from} → {segment.to}
                                    </span>
                                    <span>
                                        {segment.source} · {segment.pointCount} points
                                        {segment.distanceMeters
                                            ? ` · ${(segment.distanceMeters / 1000).toFixed(1)} km`
                                            : ""}
                                    </span>
                                </div>
                                {segment.error ? (
                                    <p className="mt-1 text-amber-700 dark:text-amber-300">
                                        {segment.error}
                                    </p>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
