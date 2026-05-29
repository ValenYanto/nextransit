"use client";

import { useEffect } from "react";
import L from "leaflet";
import {
    Circle,
    CircleMarker,
    MapContainer,
    Marker,
    Polyline,
    Popup,
    TileLayer,
    useMap,
    useMapEvents,
} from "react-leaflet";

import { StatusBadge } from "@/components/shared/status-badge";
import { getBoardingRecommendation } from "@/lib/recommendation/boarding";

export type RouteLiveStop = {
    id: string;
    code: string;
    name: string;
    type: string;
    latitude: number;
    longitude: number;
    area: string | null;
    sequence: number;
    arrivalTime: string;
    departureTime: string;
};

export type RoutePathPoint = {
    latitude: number;
    longitude: number;
    sequence: number;
};

export type RouteLiveVehicle = {
    id: string;
    code: string;
    plateNumber: string | null;
    type: string;
    status: string;
    direction: "OUTBOUND" | "INBOUND";
    directionLabel: string;
    capacity: number;
    passengerCount: number;
    occupancyRate: number;
    crowdLevel: string;
    position: {
        latitude: number;
        longitude: number;
        speedKmh: number;
        heading: number | null;
        recordedAt: string;
    };
    nextStop: {
        id: string;
        name: string;
        latitude: number;
        longitude: number;
    } | null;
    etaToNextStopMinutes: number | null;
    etaToNextStopFormatted: string;
    trafficLevel: string;
    confidence: number;
    lastUpdated?: string;
};

export type UserLocation = {
    latitude: number;
    longitude: number;
    accuracy: number;
    source: "gps" | "manual" | "fallback";
    updatedAt: string;
};

export type NearestStopSummary = {
    name: string;
    distanceKm: number;
} | null;

type RouteLiveMapProps = {
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
};

const vehicleIcon = L.divIcon({
    className: "",
    html: '<div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-cyan-600 text-[10px] font-bold text-white shadow-sm">V</div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

const selectedVehicleIcon = L.divIcon({
    className: "",
    html: '<div class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-950 text-[11px] font-bold text-white shadow-md">LIVE</div>',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

const userIcon = L.divIcon({
    className: "",
    html: '<div class="h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-[0_0_0_8px_rgba(37,99,235,0.18)]"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

export function RouteLiveMap({
    routeName,
    stops,
    pathPoints,
    vehicles,
    userLocation,
    nearestStop,
    isManualLocationMode,
    selectedVehicleId,
    selectedStopId,
    onSelectVehicle,
    onSelectStop,
    onManualLocationSelect,
}: RouteLiveMapProps) {
    const lineSource = pathPoints.length > 0 ? pathPoints : stops;
    const routeLine = lineSource.map((point) => [point.latitude, point.longitude] as [number, number]);
    const center = routeLine[0] ?? [-6.2008, 106.8229];

    return (
        <div className="h-[460px] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950 md:h-[560px]">
            <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
                <ManualLocationPicker
                    enabled={isManualLocationMode}
                    onSelect={onManualLocationSelect}
                />
                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FitMap
                    stops={stops}
                    pathPoints={pathPoints}
                    vehicles={vehicles}
                    userLocation={userLocation}
                />

                {routeLine.length > 1 ? (
                    <Polyline
                        positions={routeLine}
                        pathOptions={{
                            color: "#0891b2",
                            weight: 5,
                            opacity: 0.85,
                            lineCap: "round",
                            lineJoin: "round",
                        }}
                    />
                ) : null}

                {stops.map((stop) => (
                    <CircleMarker
                        key={stop.id}
                        center={[stop.latitude, stop.longitude]}
                        radius={selectedStopId === stop.id ? 9 : 6}
                        pathOptions={{
                            color: selectedStopId === stop.id ? "#0f172a" : "#0891b2",
                            weight: 2,
                            fillColor: "#ffffff",
                            fillOpacity: 1,
                        }}
                        eventHandlers={{
                            click: () => onSelectStop(stop.id),
                        }}
                    >
                        <Popup>
                            <div className="min-w-48 space-y-1">
                                <p className="font-semibold">{stop.name}</p>
                                <p className="text-xs text-slate-600">
                                    Stop {stop.sequence} · {stop.type}
                                </p>
                                <p className="text-xs text-slate-600">
                                    Scheduled arrival {stop.arrivalTime}
                                </p>
                                <p className="text-xs text-slate-600">{routeName}</p>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}

                {vehicles.map((vehicle) => {
                    const recommendation = getBoardingRecommendation({
                        crowdLevel: vehicle.crowdLevel,
                        etaMinutes: vehicle.etaToNextStopMinutes,
                    });

                    return (
                        <Marker
                            key={vehicle.id}
                            position={[
                                vehicle.position.latitude,
                                vehicle.position.longitude,
                            ]}
                            icon={selectedVehicleId === vehicle.id ? selectedVehicleIcon : vehicleIcon}
                            eventHandlers={{
                                click: () => onSelectVehicle(vehicle.id),
                            }}
                        >
                            <Popup>
                                <div className="min-w-56 space-y-2">
                                    <div>
                                        <p className="font-semibold">{vehicle.code}</p>
                                        <p className="text-xs text-slate-600">{vehicle.directionLabel}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        <StatusBadge status={vehicle.crowdLevel} />
                                        <StatusBadge status={vehicle.status} />
                                        <StatusBadge status={vehicle.type} />
                                    </div>
                                    <div className="text-xs text-slate-600">
                                        <p>Next stop: {vehicle.nextStop?.name ?? "Terminal"}</p>
                                        <p>Arrives in: {vehicle.etaToNextStopFormatted}</p>
                                        <p>
                                            Passengers: {vehicle.passengerCount}/{vehicle.capacity}
                                        </p>
                                        <p>Speed: {vehicle.position.speedKmh} km/h</p>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 p-2 text-xs text-slate-700">
                                        <p className="font-medium">{recommendation.label}</p>
                                        <p>{recommendation.description}</p>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {userLocation ? (
                    <>
                        <Circle
                            center={[userLocation.latitude, userLocation.longitude]}
                            radius={Math.max(userLocation.accuracy, 10)}
                            pathOptions={{
                                color: "#2563eb",
                                weight: 1,
                                opacity: 0.25,
                                fillColor: "#2563eb",
                                fillOpacity: 0.08,
                            }}
                        />
                        <Marker
                            position={[userLocation.latitude, userLocation.longitude]}
                            icon={userIcon}
                        >
                            <Popup>
                                <div className="space-y-1">
                                    <p className="font-semibold">Your location</p>
                                    <p className="text-xs text-slate-600">
                                        Source: {formatLocationSource(userLocation.source)}
                                    </p>
                                    <p className="text-xs text-slate-600">
                                        Accuracy: {Math.round(userLocation.accuracy)} m
                                    </p>
                                    {nearestStop ? (
                                        <p className="text-xs text-slate-600">
                                            Nearest stop: {nearestStop.name} ({nearestStop.distanceKm.toFixed(2)} km)
                                        </p>
                                    ) : null}
                                </div>
                            </Popup>
                        </Marker>
                    </>
                ) : null}
            </MapContainer>
        </div>
    );
}

function ManualLocationPicker({
    enabled,
    onSelect,
}: {
    enabled: boolean;
    onSelect: (location: { latitude: number; longitude: number }) => void;
}) {
    useMapEvents({
        click(event) {
            if (!enabled) return;

            onSelect({
                latitude: event.latlng.lat,
                longitude: event.latlng.lng,
            });
        },
    });

    return null;
}

function formatLocationSource(source: UserLocation["source"]) {
    if (source === "gps") return "GPS";
    if (source === "manual") return "Manual";
    return "Fallback Jakarta";
}

function FitMap({
    stops,
    pathPoints,
    vehicles,
    userLocation,
}: {
    stops: RouteLiveStop[];
    pathPoints: RoutePathPoint[];
    vehicles: RouteLiveVehicle[];
    userLocation: UserLocation | null;
}) {
    const map = useMap();

    useEffect(() => {
        const points = [
            ...stops.map((stop) => [stop.latitude, stop.longitude] as [number, number]),
            ...pathPoints.map((point) => [point.latitude, point.longitude] as [number, number]),
            ...vehicles.map((vehicle) => [
                vehicle.position.latitude,
                vehicle.position.longitude,
            ] as [number, number]),
            ...(userLocation
                ? [[userLocation.latitude, userLocation.longitude] as [number, number]]
                : []),
        ];

        if (points.length > 0) {
            map.fitBounds(points, { padding: [36, 36], maxZoom: 14 });
        }
    }, [map, stops, pathPoints, vehicles, userLocation]);

    return null;
}
