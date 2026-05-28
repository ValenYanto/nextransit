"use client";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import { StatusBadge } from "@/components/shared/status-badge";

type LiveVehicle = {
    id: string;
    code: string;
    type: string;
    status: string;
    passengerCount: number;
    capacity: number;
    crowdLevel: string;
    etaFormatted: string;
    distanceToUserKm: number;
    route: {
        name: string;
    } | null;
    position: {
        latitude: number;
        longitude: number;
        speedKmh: number;
    };
};

type PassengerLiveMapProps = {
    vehicles: LiveVehicle[];
    userLocation: {
        latitude: number;
        longitude: number;
    };
};

const vehicleIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const userIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

export function PassengerLiveMap({
    vehicles,
    userLocation,
}: PassengerLiveMapProps) {
    return (
        <div className="h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
            <MapContainer
                center={[userLocation.latitude, userLocation.longitude]}
                zoom={13}
                scrollWheelZoom
                className="h-full w-full"
            >
                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker
                    position={[userLocation.latitude, userLocation.longitude]}
                    icon={userIcon}
                >
                    <Popup>
                        <div className="space-y-1">
                            <p className="font-semibold">Your location</p>
                            <p className="text-xs text-slate-600">
                                Current passenger pickup point
                            </p>
                        </div>
                    </Popup>
                </Marker>

                {vehicles.map((vehicle) => (
                    <Marker
                        key={vehicle.id}
                        position={[
                            vehicle.position.latitude,
                            vehicle.position.longitude,
                        ]}
                        icon={vehicleIcon}
                    >
                        <Popup>
                            <div className="min-w-56 space-y-2">
                                <div>
                                    <p className="font-semibold">{vehicle.code}</p>
                                    <p className="text-xs text-slate-600">
                                        {vehicle.route?.name ?? "Unassigned route"}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    <StatusBadge status={vehicle.type} />
                                    <StatusBadge status={vehicle.crowdLevel} />
                                </div>

                                <div className="text-xs text-slate-600">
                                    <p>ETA: {vehicle.etaFormatted}</p>
                                    <p>Distance: {vehicle.distanceToUserKm} km</p>
                                    <p>
                                        Passenger: {vehicle.passengerCount}/{vehicle.capacity}
                                    </p>
                                    <p>Speed: {vehicle.position.speedKmh} km/h</p>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}