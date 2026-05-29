"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
    CheckCircle2,
    Loader2,
    MapPin,
    MousePointer2,
    Save,
    Trash2,
    Undo2,
} from "lucide-react";
import {
    CircleMarker,
    MapContainer,
    Polyline,
    Popup,
    TileLayer,
    useMapEvents,
} from "react-leaflet";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";

type Coordinate = {
    latitude: number;
    longitude: number;
};

type BuilderStop = Coordinate & {
    id: string;
    code: string;
    name: string;
    type: string;
    sequence: number;
};

type BuilderRoute = {
    id: string;
    code: string;
    name: string;
    type: string;
    origin: string;
    destination: string;
    pathSource: string | null;
    pathPointCount: number;
    stops: BuilderStop[];
    pathPoints: Array<Coordinate & { sequence: number }>;
};

type BuilderMode = "VIEW" | "PATH" | "STOP";

type StopDraft = Coordinate & {
    code: string;
    name: string;
    type: "BUS_STOP" | "STATION" | "TERMINAL";
    area: string;
};

export function PathBuilderMap({ routes }: { routes: BuilderRoute[] }) {
    const [selectedRouteId, setSelectedRouteId] = useState(routes[0]?.id ?? "");
    const [mode, setMode] = useState<BuilderMode>("VIEW");
    const [draftPoints, setDraftPoints] = useState<Coordinate[]>([]);
    const [stopDraft, setStopDraft] = useState<StopDraft | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const selectedRoute = routes.find((route) => route.id === selectedRouteId) ?? routes[0];
    const routeLine = selectedRoute?.pathPoints.map((point) => [point.latitude, point.longitude] as [number, number]) ?? [];
    const draftLine = draftPoints.map((point) => [point.latitude, point.longitude] as [number, number]);
    const center = routeLine[0] ?? [-6.2, 106.82];

    const instruction = useMemo(() => {
        if (mode === "PATH") return "Click points in order from start to finish. Save when the line looks right.";
        if (mode === "STOP") return "Click the map where the stop or station should be. Coordinates are filled automatically.";
        return "View the current route line and stops. Choose an edit mode to make changes.";
    }, [mode]);

    const handleMapClick = (point: Coordinate) => {
        setMessage(null);
        setError(null);

        if (mode === "PATH") {
            setDraftPoints((points) => [...points, point]);
            return;
        }

        if (mode === "STOP") {
            setStopDraft({
                latitude: point.latitude,
                longitude: point.longitude,
                code: "",
                name: "",
                type: selectedRoute?.type === "BUS" || selectedRoute?.type === "FEEDER" ? "BUS_STOP" : "STATION",
                area: "",
            });
        }
    };

    const saveManualPath = async () => {
        if (!selectedRoute || draftPoints.length < 2) {
            setError("Click at least two path points before saving.");
            return;
        }

        setIsSaving(true);
        setError(null);
        setMessage(null);

        try {
            const response = await fetch(`/api/admin/routes/${selectedRoute.id}/manual-path`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    points: draftPoints.map((point, index) => ({
                        ...point,
                        sequence: index + 1,
                    })),
                }),
            });
            const json = (await response.json()) as { message?: string; pathPointCount?: number };

            if (!response.ok) {
                throw new Error(json.message ?? "Failed to save manual path.");
            }

            setMessage(`Manual path saved with ${json.pathPointCount ?? draftPoints.length} points. Refresh to see the updated route.`);
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Failed to save manual path.");
        } finally {
            setIsSaving(false);
        }
    };

    const saveStop = async () => {
        if (!stopDraft) return;

        setIsSaving(true);
        setError(null);
        setMessage(null);

        try {
            const response = await fetch("/api/admin/stops", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: stopDraft.code,
                    name: stopDraft.name,
                    type: stopDraft.type,
                    area: stopDraft.area,
                    latitude: stopDraft.latitude,
                    longitude: stopDraft.longitude,
                    isActive: true,
                }),
            });
            const json = (await response.json()) as { message?: string; stop?: { name: string } };

            if (!response.ok) {
                throw new Error(json.message ?? "Failed to save stop.");
            }

            setMessage(`${json.stop?.name ?? "Stop"} saved. Add it to a route from Schedules.`);
            setStopDraft(null);
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Failed to save stop.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-none dark:border-white/10 dark:bg-slate-950">
            <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
                <aside className="space-y-4">
                    <div>
                        <p className="text-sm font-semibold">Visual route builder</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Build paths and stops from the map. No coordinate typing needed.
                        </p>
                    </div>

                    <label className="block space-y-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Route
                        </span>
                        <select
                            value={selectedRouteId}
                            onChange={(event) => {
                                setSelectedRouteId(event.target.value);
                                setDraftPoints([]);
                                setStopDraft(null);
                            }}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                        >
                            {routes.map((route) => (
                                <option key={route.id} value={route.id}>
                                    {route.code} · {route.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    {selectedRoute ? (
                        <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
                            <div className="flex flex-wrap gap-2">
                                <StatusBadge status={selectedRoute.type} />
                                <StatusBadge status={selectedRoute.pathSource ?? "UNKNOWN"} />
                            </div>
                            <p className="mt-3 text-sm font-medium">{selectedRoute.origin} → {selectedRoute.destination}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {selectedRoute.stops.length} stops · {selectedRoute.pathPointCount || selectedRoute.pathPoints.length} path points
                            </p>
                        </div>
                    ) : null}

                    <div className="grid gap-2">
                        <ModeButton active={mode === "VIEW"} onClick={() => setMode("VIEW")} icon={MousePointer2} label="View path" />
                        <ModeButton active={mode === "PATH"} onClick={() => setMode("PATH")} icon={MapPin} label="Click map to add path" />
                        <ModeButton active={mode === "STOP"} onClick={() => setMode("STOP")} icon={MapPin} label="Click map to add stop" />
                    </div>

                    <p className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs leading-5 text-cyan-800 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200">
                        {instruction}
                    </p>

                    {mode === "PATH" ? (
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDraftPoints((points) => points.slice(0, -1))}
                                    disabled={draftPoints.length === 0}
                                    className="rounded-xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-transparent"
                                >
                                    <Undo2 className="mr-2 h-4 w-4" />
                                    Undo
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDraftPoints([])}
                                    disabled={draftPoints.length === 0}
                                    className="rounded-xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-transparent"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Clear
                                </Button>
                            </div>
                            <Button
                                type="button"
                                onClick={saveManualPath}
                                disabled={isSaving || draftPoints.length < 2}
                                className="w-full rounded-xl bg-slate-950 text-white shadow-none dark:bg-white dark:text-slate-950"
                            >
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save manual path
                            </Button>
                        </div>
                    ) : null}

                    {stopDraft ? (
                        <div className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-white/10">
                            <p className="text-sm font-medium">New stop</p>
                            <input value={stopDraft.code} onChange={(event) => setStopDraft({ ...stopDraft, code: event.target.value })} placeholder="Stop code" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                            <input value={stopDraft.name} onChange={(event) => setStopDraft({ ...stopDraft, name: event.target.value })} placeholder="Stop name" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                            <select value={stopDraft.type} onChange={(event) => setStopDraft({ ...stopDraft, type: event.target.value as StopDraft["type"] })} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900">
                                <option value="BUS_STOP">Bus stop</option>
                                <option value="STATION">Station</option>
                                <option value="TERMINAL">Terminal</option>
                            </select>
                            <input value={stopDraft.area} onChange={(event) => setStopDraft({ ...stopDraft, area: event.target.value })} placeholder="Area" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {stopDraft.latitude.toFixed(6)}, {stopDraft.longitude.toFixed(6)}
                            </p>
                            <Button
                                type="button"
                                onClick={saveStop}
                                disabled={isSaving || !stopDraft.code || !stopDraft.name}
                                className="w-full rounded-xl bg-slate-950 text-white shadow-none dark:bg-white dark:text-slate-950"
                            >
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                Save stop
                            </Button>
                        </div>
                    ) : null}

                    {message ? (
                        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                            {message}
                        </p>
                    ) : null}
                    {error ? (
                        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
                            {error}
                        </p>
                    ) : null}
                </aside>

                <div className="h-[460px] overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 md:h-[620px]">
                    <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
                        <TileLayer
                            attribution="&copy; OpenStreetMap contributors"
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <ClickHandler onClick={handleMapClick} />

                        {routeLine.length > 1 ? (
                            <Polyline
                                positions={routeLine}
                                pathOptions={{
                                    color: "#64748b",
                                    weight: 4,
                                    opacity: 0.55,
                                    lineCap: "round",
                                    lineJoin: "round",
                                }}
                            />
                        ) : null}
                        {draftLine.length > 1 ? (
                            <Polyline
                                positions={draftLine}
                                pathOptions={{
                                    color: "#0891b2",
                                    weight: 5,
                                    opacity: 0.9,
                                    lineCap: "round",
                                    lineJoin: "round",
                                }}
                            />
                        ) : null}
                        {draftPoints.map((point, index) => (
                            <CircleMarker
                                key={`${point.latitude}-${point.longitude}-${index}`}
                                center={[point.latitude, point.longitude]}
                                radius={7}
                                pathOptions={{ color: "#0891b2", fillColor: "#0891b2", fillOpacity: 1 }}
                            >
                                <Popup>Path point {index + 1}</Popup>
                            </CircleMarker>
                        ))}
                        {selectedRoute?.stops.map((stop) => (
                            <CircleMarker
                                key={stop.id}
                                center={[stop.latitude, stop.longitude]}
                                radius={6}
                                pathOptions={{
                                    color: "#0f172a",
                                    weight: 2,
                                    fillColor: "#ffffff",
                                    fillOpacity: 1,
                                }}
                            >
                                <Popup>
                                    <div className="text-sm">
                                        <p className="font-semibold">{stop.name}</p>
                                        <p className="text-xs text-slate-600">{stop.sequence}. {stop.code}</p>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        ))}
                        {stopDraft ? (
                            <CircleMarker
                                center={[stopDraft.latitude, stopDraft.longitude]}
                                radius={9}
                                pathOptions={{
                                    color: "#0891b2",
                                    fillColor: "#67e8f9",
                                    fillOpacity: 0.8,
                                }}
                            >
                                <Popup>New stop location</Popup>
                            </CircleMarker>
                        ) : null}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}

function ClickHandler({ onClick }: { onClick: (point: Coordinate) => void }) {
    useMapEvents({
        click(event) {
            onClick({
                latitude: event.latlng.lat,
                longitude: event.latlng.lng,
            });
        },
    });

    return null;
}

function ModeButton({
    active,
    onClick,
    icon: Icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: ComponentType<{ className?: string }>;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${active
                ? "border-cyan-300 bg-cyan-50 text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-200"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/5"
                }`}
        >
            <Icon className="h-4 w-4" />
            {label}
        </button>
    );
}
