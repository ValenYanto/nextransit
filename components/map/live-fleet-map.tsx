"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

import { DEFAULT_MAP_ZOOM, JAKARTA_CENTER } from "@/lib/data/demo-coordinates";
import { StatusBadge } from "@/components/shared/status-badge";

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

type LiveFleetMapProps = {
    markers: FleetMarker[];
};

function makeVehicleIcon(type: string) {
    const normalized = type.toUpperCase();
    const emoji =
        normalized === "MRT" ? "🚇" : normalized === "LRT" ? "🚈" : normalized === "FEEDER" ? "🚐" : "🚌";

    return L.divIcon({
        className: "",
        html: `<div style="
            width:36px;height:36px;
            background:#001011;
            border:2.5px solid #6CCFF6;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:16px;
            box-shadow:0 2px 8px rgba(0,0,0,0.25);
        ">${emoji}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
    });
}

export function LiveFleetMap({ markers }: LiveFleetMapProps) {
    return (
        <div className="h-[520px] overflow-hidden rounded-2xl border border-gray-100 dark:border-white/[0.07]">
            <MapContainer
                center={[JAKARTA_CENTER.lat, JAKARTA_CENTER.lng]}
                zoom={DEFAULT_MAP_ZOOM}
                scrollWheelZoom
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    subdomains={["a", "b", "c", "d"]}
                    maxZoom={19}
                />

                {markers.map((marker) => (
                    <Marker
                        key={marker.id}
                        position={[marker.latitude, marker.longitude]}
                        icon={makeVehicleIcon(marker.type)}
                    >
                        <Popup>
                            <div className="min-w-48 space-y-2">
                                <p className="font-semibold">{marker.code}</p>
                                <p className="text-xs text-[#757780]">{marker.routeName}</p>
                                <div className="flex gap-2">
                                    <StatusBadge status={marker.status} />
                                    <StatusBadge status={marker.type} />
                                </div>
                                <p className="text-xs text-[#757780]">
                                    Speed: {marker.speedKmh} km/h
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
