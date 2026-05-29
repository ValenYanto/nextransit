export type RealtimeProviderName =
    | "SIMULATION"
    | "GTFS_RT"
    | "TRANSJAKARTA"
    | "GOOGLE_MAPS_UNAVAILABLE";

export type RealtimeVehicle = {
    id: string;
    code: string;
    routeCode: string;
    latitude: number;
    longitude: number;
    speedKmh: number;
    heading: number | null;
    recordedAt: string;
    source: RealtimeProviderName;
};

export type RealtimeProviderResult = {
    provider: RealtimeProviderName;
    vehicles: RealtimeVehicle[];
    generatedAt: string;
    fallbackUsed: boolean;
    message?: string;
};
