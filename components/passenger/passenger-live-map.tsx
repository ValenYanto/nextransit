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

const userIcon = L.divIcon({
    className: "",
    html: `<div style="
        width:16px;height:16px;
        background:#6CCFF6;
        border:3px solid #FFFFFF;
        border-radius:50%;
        box-shadow:0 0 0 6px rgba(108,207,246,0.25);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
});

export function PassengerLiveMap({
    vehicles,
    userLocation,
}: PassengerLiveMapProps) {
    return (
        <div className="h-[520px] overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-white/[0.07] dark:bg-[#0d1f22]">
            <MapContainer
                center={[userLocation.latitude, userLocation.longitude]}
                zoom={13}
                scrollWheelZoom
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    subdomains={["a", "b", "c", "d"]}
                    maxZoom={19}
                />

                <Marker
                    position={[userLocation.latitude, userLocation.longitude]}
                    icon={userIcon}
                >
                    <Popup>
                        <div className="space-y-1">
                            <p className="font-semibold">Your location</p>
                            <p className="text-xs text-[#757780]">
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
                        icon={makeVehicleIcon(vehicle.type)}
                    >
                        <Popup>
                            <div className="min-w-56 space-y-2">
                                <div>
                                    <p className="font-semibold">{vehicle.code}</p>
                                    <p className="text-xs text-[#757780]">
                                        {vehicle.route?.name ?? "Unassigned route"}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    <StatusBadge status={vehicle.type} />
                                    <StatusBadge status={vehicle.crowdLevel} />
                                </div>

                                <div className="text-xs text-[#757780]">
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
