"use client";

import { useMemo, useEffect } from "react";
import L from "leaflet";
import {
    Circle,
    CircleMarker,
    MapContainer,
    Marker,
    Polyline,
    Popup,
    TileLayer,
    Tooltip,
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

function getVehicleIcon(type: string, selected: boolean) {
    const normalized = type.toUpperCase();
    const icon = normalized === "MRT" ? "🚇" : normalized === "LRT" ? "🚈" : normalized === "FEEDER" ? "🚐" : "🚌";
    const size = selected ? 38 : 32;

    return L.divIcon({
        className: "",
        html: `<div style="
            width:${size}px; height:${size}px;
            background:#001011; border:2px solid #6CCFF6;
            border-radius:50%; display:flex; align-items:center; justify-content:center;
            font-size:${selected ? 17 : 14}px; box-shadow:0 2px 8px rgba(0,0,0,0.3);
        ">${icon}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
}

const userIcon = L.divIcon({
    className: "",
    html: '<div class="h-4 w-4 rounded-full border-2 border-white bg-[#6CCFF6] shadow-[0_0_0_8px_rgba(108,207,246,0.25)]"></div>',
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
    const center = useMemo(() => {
        const points = routeLine.length > 0 ? routeLine : stops.map((stop) => [stop.latitude, stop.longitude] as [number, number]);
        if (points.length === 0) return [-6.2008, 106.8229] as [number, number];
        return [
            points.reduce((sum, point) => sum + point[0], 0) / points.length,
            points.reduce((sum, point) => sum + point[1], 0) / points.length,
        ] as [number, number];
    }, [routeLine, stops]);

    return (
        <div className="h-[45vh] max-h-[350px] min-h-[320px] overflow-hidden rounded-2xl bg-white dark:bg-[#0a1a1c] md:h-full md:max-h-none md:min-h-0">
            <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
                <ManualLocationPicker
                    enabled={isManualLocationMode}
                    onSelect={onManualLocationSelect}
                />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    subdomains={["a", "b", "c", "d"]}
                    maxZoom={19}
                />

                <FitMap
                    stops={stops}
                    pathPoints={pathPoints}
                    vehicles={vehicles}
                    userLocation={userLocation}
                />

                {routeLine.length > 1 ? (
                    <>
                        <Polyline
                            positions={routeLine}
                            pathOptions={{
                                color: "#FFFFFF",
                                weight: 9,
                                opacity: 0.7,
                                lineCap: "round",
                                lineJoin: "round",
                            }}
                        />
                        <Polyline
                            positions={routeLine}
                            pathOptions={{
                                color: "#6CCFF6",
                                weight: 5,
                                opacity: 1,
                                lineCap: "round",
                                lineJoin: "round",
                            }}
                        />
                    </>
                ) : null}

                {stops.map((stop) => (
                    <CircleMarker
                        key={stop.id}
                        center={[stop.latitude, stop.longitude]}
                        radius={selectedStopId === stop.id ? 10 : 7}
                        pathOptions={{
                            color: selectedStopId === stop.id ? "#001011" : "#6CCFF6",
                            weight: selectedStopId === stop.id ? 2 : 2.5,
                            fillColor: selectedStopId === stop.id ? "#6CCFF6" : "#FFFFFC",
                            fillOpacity: 1,
                        }}
                        eventHandlers={{
                            click: () => onSelectStop(stop.id),
                        }}
                    >
                        <Tooltip>{stop.name}</Tooltip>
                        <Popup>
                            <div className="min-w-48 space-y-1">
                                <p className="font-semibold">{stop.name}</p>
                                <p className="text-xs text-[#757780]">
                                    Stop {stop.sequence} · {stop.type}
                                </p>
                                <p className="text-xs text-[#757780]">
                                    Scheduled arrival {stop.arrivalTime}
                                </p>
                                <p className="text-xs text-[#757780]">{routeName}</p>
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
                            icon={getVehicleIcon(vehicle.type, selectedVehicleId === vehicle.id)}
                            eventHandlers={{
                                click: () => onSelectVehicle(vehicle.id),
                            }}
                        >
                            <Popup>
                                <div className="min-w-56 space-y-2">
                                    <div>
                                        <p className="font-semibold">{vehicle.code}</p>
                                        <p className="text-xs text-[#757780]">{vehicle.directionLabel}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        <StatusBadge status={vehicle.crowdLevel} />
                                        <StatusBadge status={vehicle.status} />
                                        <StatusBadge status={vehicle.type} />
                                    </div>
                                    <div className="text-xs text-[#757780]">
                                        <p>Next stop: {vehicle.nextStop?.name ?? "Terminal"}</p>
                                        <p>Arrives in: {vehicle.etaToNextStopFormatted}</p>
                                        <p>
                                            Passengers: {vehicle.passengerCount}/{vehicle.capacity}
                                        </p>
                                        <p>Speed: {vehicle.position.speedKmh} km/h</p>
                                    </div>
                                    <div className="rounded-lg bg-[#6CCFF6]/10 p-2 text-xs text-[#001011]">
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
                                color: "#6CCFF6",
                                weight: 1,
                                opacity: 0.25,
                                fillColor: "#6CCFF6",
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
                                    <p className="text-xs text-[#757780]">
                                        Source: {formatLocationSource(userLocation.source)}
                                    </p>
                                    <p className="text-xs text-[#757780]">
                                        Accuracy: {Math.round(userLocation.accuracy)} m
                                    </p>
                                    {nearestStop ? (
                                        <p className="text-xs text-[#757780]">
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
            map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
        }
    }, [map, stops, pathPoints, vehicles, userLocation]);

    return null;
}
