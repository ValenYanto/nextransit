"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import L from "leaflet";
import { toast } from "sonner";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Eye, MapPin, Save, Trash2, Undo2 } from "lucide-react";

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

type BuilderMode = "view" | "addPath" | "addStop";

type OsrmRouteResponse = {
  code?: string;
  routes?: Array<{
    geometry?: {
      coordinates?: Array<[number, number]>;
    };
  }>;
};

const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving";

const stopPinIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;background:#F59E0B;border:2px solid #001011;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.25);font-size:14px;">＋</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

async function fetchOSRMPath(points: Coordinate[]): Promise<Coordinate[]> {
  if (points.length < 2) return points;

  const coordinates = points.map((point) => `${point.longitude},${point.latitude}`).join(";");
  const url = `${OSRM_BASE_URL}/${coordinates}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    const data = (await response.json()) as OsrmRouteResponse;
    const osrmCoordinates = data.routes?.[0]?.geometry?.coordinates;

    if (!response.ok || data.code !== "Ok" || !osrmCoordinates?.length) {
      console.warn("OSRM failed, using straight line fallback");
      return points;
    }

    return osrmCoordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
  } catch (error) {
    console.warn("OSRM error, using straight line fallback:", error);
    return points;
  }
}

export function PathBuilderMap({ routes }: { routes: BuilderRoute[] }) {
  const [selectedRouteId, setSelectedRouteId] = useState(routes[0]?.id ?? "");
  const [mode, setMode] = useState<BuilderMode>("view");
  const [draftPoints, setDraftPoints] = useState<Coordinate[]>([]);
  const [snappedPath, setSnappedPath] = useState<Coordinate[]>([]);
  const [isLoadingOSRM, setIsLoadingOSRM] = useState(false);
  const [pendingStopCoords, setPendingStopCoords] = useState<Coordinate | null>(null);
  const [savedPathOverrides, setSavedPathOverrides] = useState<Record<string, Coordinate[]>>({});
  const [isSaving, setIsSaving] = useState(false);

  const selectedRoute = routes.find((route) => route.id === selectedRouteId) ?? routes[0];
  const currentPath = useMemo(() => {
    if (!selectedRoute) return [];
    return savedPathOverrides[selectedRoute.id] ?? selectedRoute.pathPoints;
  }, [savedPathOverrides, selectedRoute]);
  const routeType = selectedRoute?.type.toUpperCase() ?? "";
  const routeName = selectedRoute?.name.toLowerCase() ?? "";
  const useOSRM =
    routeType === "BUS" ||
    routeType === "FEEDER" ||
    routeType.includes("BUS") ||
    routeType.includes("FEEDER") ||
    routeName.includes("transjakarta");
  const routeLine = currentPath.map((point) => [point.latitude, point.longitude] as [number, number]);
  const draftLine = snappedPath.map((point) => [point.latitude, point.longitude] as [number, number]);
  const center: [number, number] =
    routeLine[0] ??
    (selectedRoute?.stops[0]
      ? [selectedRoute.stops[0].latitude, selectedRoute.stops[0].longitude]
      : [-6.2, 106.82]);

  function resetForRoute(routeId: string) {
    setSelectedRouteId(routeId);
    setDraftPoints([]);
    setSnappedPath([]);
    setIsLoadingOSRM(false);
    setPendingStopCoords(null);
    setMode("view");
  }

  async function handleAddPathPoint(point: Coordinate) {
    const nextPoints = [...draftPoints, point];
    setDraftPoints(nextPoints);

    if (useOSRM && nextPoints.length >= 2) {
      setIsLoadingOSRM(true);
      const snapped = await fetchOSRMPath(nextPoints);
      setSnappedPath(snapped);
      setIsLoadingOSRM(false);
      return;
    }

    setSnappedPath(nextPoints);
  }

  async function undoLastPoint() {
    const nextPoints = draftPoints.slice(0, -1);
    setDraftPoints(nextPoints);

    if (useOSRM && nextPoints.length >= 2) {
      setIsLoadingOSRM(true);
      const snapped = await fetchOSRMPath(nextPoints);
      setSnappedPath(snapped);
      setIsLoadingOSRM(false);
      return;
    }

    setSnappedPath(nextPoints);
  }

  function clearDraft() {
    setDraftPoints([]);
    setSnappedPath([]);
  }

  async function savePath() {
    const pointsToSave = useOSRM ? snappedPath : draftPoints;
    if (!selectedRoute || pointsToSave.length < 2 || isLoadingOSRM) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/routes/${selectedRoute.id}/manual-path`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          points: pointsToSave.map((point, index) => ({
            latitude: point.latitude,
            longitude: point.longitude,
            sequence: index + 1,
          })),
        }),
      });
      const json = (await response.json()) as { message?: string; pathPointCount?: number };

      if (!response.ok) throw new Error(json.message ?? "Failed to save path.");

      setSavedPathOverrides((current) => ({ ...current, [selectedRoute.id]: pointsToSave }));
      setDraftPoints([]);
      setSnappedPath([]);
      setMode("view");
      toast.success("Path saved successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save path");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveStop(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingStopCoords) return;

    const formData = new FormData(event.currentTarget);
    setIsSaving(true);
    try {
      const payload = {
        name: String(formData.get("name") ?? ""),
        code: String(formData.get("code") ?? ""),
        type: String(formData.get("type") ?? "BUS_STOP"),
        area: String(formData.get("area") ?? ""),
        latitude: pendingStopCoords.latitude,
        longitude: pendingStopCoords.longitude,
        isActive: true,
      };
      const response = await fetch("/api/admin/stops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as { message?: string };

      if (!response.ok) throw new Error(json.message ?? "Failed to save stop.");

      setPendingStopCoords(null);
      setMode("view");
      toast.success("Stop added");
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save stop");
    } finally {
      setIsSaving(false);
    }
  }

  if (!selectedRoute) {
    return (
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 text-sm text-[#757780] dark:border-[#1a2f32] dark:bg-[#0d1f22]">
        No routes available.
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-150px)] min-h-[720px] overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white dark:border-[#1a2f32] dark:bg-[#001011]">
      <div className="flex h-full min-w-0">
        <aside className="z-10 w-80 shrink-0 overflow-y-auto border-r border-[#e5e7eb] bg-[#FFFFFC] p-5 dark:border-[#1a2f32] dark:bg-[#001011]">
          <label className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-[#757780]">Select Route</span>
            <select
              value={selectedRouteId}
              onChange={(event) => resetForRoute(event.target.value)}
              className="h-11 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm text-[#001011] outline-none dark:border-[#1a2f32] dark:bg-[#0d1f22] dark:text-[#FFFFFC]"
            >
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  [{route.code}] {route.name}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-5 rounded-2xl border border-[#e5e7eb] bg-white p-4 text-sm dark:border-[#1a2f32] dark:bg-[#0d1f22]">
            <p className="font-medium text-[#001011] dark:text-[#FFFFFC]">{selectedRoute.code} — {selectedRoute.name}</p>
            <p className="mt-1 text-xs text-[#757780]">{selectedRoute.type}</p>
            <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${useOSRM ? "bg-[#6CCFF6]/10 text-[#6CCFF6]" : "bg-[#10B981]/10 text-[#10B981]"}`}>
              {useOSRM ? "Road routing (OSRM)" : "Rail routing (straight)"}
            </span>
            <p className="text-[#757780]">Source: {selectedRoute.pathSource ?? "UNKNOWN"}</p>
            <p className="mt-1 text-[#757780]">Points: {currentPath.length}</p>
            <p className="mt-1 text-[#757780]">Stops: {selectedRoute.stops.length}</p>
          </div>

          <div className="mt-6">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#757780]">Edit Mode</p>
            <div className="mt-2 space-y-2">
              <ModeButton active={mode === "view"} onClick={() => setMode("view")} icon={<Eye className="h-4 w-4" />} label="View path" />
              <ModeButton active={mode === "addPath"} onClick={() => setMode("addPath")} icon={<MapPin className="h-4 w-4" />} label="Click map to add path" />
              <ModeButton active={mode === "addStop"} onClick={() => setMode("addStop")} icon={<MapPin className="h-4 w-4" />} label="Click map to add stop" />
            </div>
          </div>

          {mode === "addPath" ? (
            <div className="mt-6 space-y-3 rounded-2xl border border-[#e5e7eb] bg-white p-4 dark:border-[#1a2f32] dark:bg-[#0d1f22]">
              <p className="text-sm text-[#757780]">
                {useOSRM
                  ? "Road routing (OSRM) — path will follow real roads automatically"
                  : "Rail routing — straight lines between points"}
              </p>
              {isLoadingOSRM ? (
                <p className="flex items-center gap-2 text-sm text-[#6CCFF6]">
                  <span className="animate-spin">⟳</span> Snapping to roads...
                </p>
              ) : null}
              <p className="text-sm font-medium">
                Anchor points: {draftPoints.length}
                {snappedPath.length > 0 && useOSRM ? (
                  <span className="ml-2 text-[#10B981]">→ {snappedPath.length} road points</span>
                ) : null}
              </p>
              <button type="button" onClick={undoLastPoint} disabled={draftPoints.length === 0 || isLoadingOSRM} className="flex min-h-10 w-full items-center justify-center rounded-xl border border-[#6CCFF6] px-3 text-sm font-medium text-[#6CCFF6] disabled:opacity-40">
                <Undo2 className="mr-2 h-4 w-4" /> Undo last point
              </button>
              <button type="button" onClick={clearDraft} disabled={draftPoints.length === 0 || isLoadingOSRM} className="flex min-h-10 w-full items-center justify-center rounded-xl border border-[#757780]/40 px-3 text-sm font-medium text-[#757780] disabled:opacity-40">
                <Trash2 className="mr-2 h-4 w-4" /> Clear draft
              </button>
              <button type="button" onClick={savePath} disabled={isSaving || isLoadingOSRM || (useOSRM ? snappedPath.length < 2 : draftPoints.length < 2)} className="flex min-h-11 w-full items-center justify-center rounded-xl bg-[#6CCFF6] px-3 text-sm font-semibold text-[#001011] disabled:opacity-40">
                <Save className="mr-2 h-4 w-4" /> {isLoadingOSRM ? "Snapping to roads..." : "Save path"}
              </button>
            </div>
          ) : null}

          {mode === "addStop" ? (
            <div className="mt-6 rounded-2xl border border-[#e5e7eb] bg-white p-4 dark:border-[#1a2f32] dark:bg-[#0d1f22]">
              <p className="text-sm text-[#757780]">Click anywhere on the map to place a stop.</p>
              {pendingStopCoords ? (
                <form onSubmit={handleSaveStop} className="mt-4 space-y-3">
                  <input name="name" required placeholder="Stop name" className="h-10 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm dark:border-[#1a2f32] dark:bg-[#001011]" />
                  <input name="code" required placeholder="Stop code" className="h-10 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm dark:border-[#1a2f32] dark:bg-[#001011]" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={pendingStopCoords.latitude.toFixed(6)} readOnly className="h-10 rounded-xl border border-[#e5e7eb] bg-[#757780]/10 px-3 text-xs dark:border-[#1a2f32]" />
                    <input value={pendingStopCoords.longitude.toFixed(6)} readOnly className="h-10 rounded-xl border border-[#e5e7eb] bg-[#757780]/10 px-3 text-xs dark:border-[#1a2f32]" />
                  </div>
                  <select name="type" className="h-10 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm dark:border-[#1a2f32] dark:bg-[#001011]">
                    <option value="BUS_STOP">BUS_STOP</option>
                    <option value="STATION">STATION</option>
                    <option value="TERMINAL">TERMINAL</option>
                  </select>
                  <input name="area" placeholder="Area" className="h-10 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm dark:border-[#1a2f32] dark:bg-[#001011]" />
                  <button type="submit" disabled={isSaving} className="min-h-11 w-full rounded-xl bg-[#6CCFF6] px-3 text-sm font-semibold text-[#001011] disabled:opacity-40">Save stop</button>
                  <button type="button" onClick={() => setPendingStopCoords(null)} className="min-h-10 w-full rounded-xl border border-[#757780]/40 px-3 text-sm text-[#757780]">Cancel</button>
                </form>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-[#6CCFF6]/30 bg-[#6CCFF6]/10 p-4 text-sm leading-6 text-[#757780]">
            {mode === "view" ? "Viewing current route path and stops. Select an edit mode to make changes." : null}
            {mode === "addPath" ? "Click on the map to add path points in order. Points connect as a line." : null}
            {mode === "addStop" ? "Click anywhere on the map to place a new stop at that location." : null}
          </div>
        </aside>

        <section
          className="relative min-w-0 flex-1 overflow-hidden"
          style={{
            cursor: mode === "addPath" ? "crosshair" : mode === "addStop" ? "cell" : "default",
          }}
        >
          <MapContainer center={center} zoom={13} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              subdomains={["a", "b", "c", "d"]}
              maxZoom={19}
            />
            <MapClickHandler mode={mode} onAddPath={handleAddPathPoint} onAddStop={setPendingStopCoords} />
            <FitBuilderMap points={[...routeLine, ...draftLine, ...selectedRoute.stops.map((stop) => [stop.latitude, stop.longitude] as [number, number])]} />

            {routeLine.length > 1 ? (
              <Polyline positions={routeLine} pathOptions={{ color: "#6CCFF6", weight: 3, opacity: 0.35, dashArray: "6 4" }} />
            ) : null}
            {draftLine.length > 1 ? (
              <Polyline positions={draftLine} pathOptions={{ color: "#10B981", weight: 4, opacity: 0.9, lineCap: "round", lineJoin: "round" }} />
            ) : null}
            {draftPoints.map((point, index) => (
              <CircleMarker
                key={`${point.latitude}-${point.longitude}-${index}`}
                center={[point.latitude, point.longitude]}
                radius={6}
                pathOptions={{ fillColor: index === 0 ? "#6CCFF6" : "#10B981", fillOpacity: 1, color: "#001011", weight: 1.5 }}
              >
                <Tooltip direction="top">{index === 0 ? "Start" : `Point ${index + 1}`}</Tooltip>
              </CircleMarker>
            ))}
            {pendingStopCoords ? (
              <Marker position={[pendingStopCoords.latitude, pendingStopCoords.longitude]} icon={stopPinIcon}>
                <Tooltip permanent>New stop here</Tooltip>
              </Marker>
            ) : null}
            {selectedRoute.stops.map((stop) => (
              <CircleMarker
                key={stop.id}
                center={[stop.latitude, stop.longitude]}
                radius={8}
                pathOptions={{ fillColor: "#FFFFFC", fillOpacity: 1, color: "#6CCFF6", weight: 2 }}
              >
                <Tooltip>{stop.name}</Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
          <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-2xl bg-[#001011]/90 px-4 py-3 text-sm text-[#FFFFFC]">
            {mode === "addPath" ? "Click on the map to add path points" : null}
            {mode === "addStop" ? "Click on the map to place a new stop" : null}
            {mode === "view" ? `${selectedRoute.code} current path preview` : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function MapClickHandler({
  mode,
  onAddPath,
  onAddStop,
}: {
  mode: BuilderMode;
  onAddPath: (point: Coordinate) => void;
  onAddStop: (point: Coordinate) => void;
}) {
  useMapEvents({
    click(event) {
      const point = { latitude: event.latlng.lat, longitude: event.latlng.lng };
      if (mode === "addPath") onAddPath(point);
      if (mode === "addStop") onAddStop(point);
    },
  });
  return null;
}

function FitBuilderMap({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [36, 36], maxZoom: 15 });
  }, [map, points]);
  return null;
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm font-medium ${
        active
          ? "border-[#6CCFF6] bg-[#6CCFF6]/15 text-[#6CCFF6]"
          : "border-[#757780]/30 text-[#757780] hover:border-[#6CCFF6]/50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
