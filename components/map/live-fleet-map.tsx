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

const vehicleIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

export function LiveFleetMap({ markers }: LiveFleetMapProps) {
    return (
        <div className="h-[520px] overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
            <MapContainer
                center={[JAKARTA_CENTER.lat, JAKARTA_CENTER.lng]}
                zoom={DEFAULT_MAP_ZOOM}
                scrollWheelZoom
                className="h-full w-full"
            >
                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {markers.map((marker) => (
                    <Marker
                        key={marker.id}
                        position={[marker.latitude, marker.longitude]}
                        icon={vehicleIcon}
                    >
                        <Popup>
                            <div className="min-w-48 space-y-2">
                                <p className="font-semibold">{marker.code}</p>
                                <p className="text-xs text-slate-600">{marker.routeName}</p>
                                <div className="flex gap-2">
                                    <StatusBadge status={marker.status} />
                                    <StatusBadge status={marker.type} />
                                </div>
                                <p className="text-xs text-slate-600">
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