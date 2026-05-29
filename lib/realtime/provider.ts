import { prisma } from "@/lib/prisma";
import type { RealtimeProviderResult, RealtimeVehicle } from "@/lib/realtime/types";

export async function getRealtimeVehiclesForRoute(
    routeCode: string,
): Promise<RealtimeProviderResult> {
    if (
        process.env.REALTIME_PROVIDER === "GTFS_RT" &&
        process.env.GTFS_RT_VEHICLE_POSITIONS_URL
    ) {
        const gtfsResult = await tryGtfsRealtimeProvider(routeCode);
        if (!gtfsResult.fallbackUsed) return gtfsResult;
    }

    return getSimulationVehiclesForRoute(routeCode);
}

async function tryGtfsRealtimeProvider(
    routeCode: string,
): Promise<RealtimeProviderResult> {
    const url = process.env.GTFS_RT_VEHICLE_POSITIONS_URL;

    if (!url) {
        return {
            provider: "GTFS_RT",
            vehicles: [],
            generatedAt: new Date().toISOString(),
            fallbackUsed: true,
            message: `GTFS_RT_VEHICLE_POSITIONS_URL is not configured for route ${routeCode}.`,
        };
    }

    try {
        const response = await fetch(url, {
            cache: "no-store",
            headers: {
                "User-Agent": "NexTransit realtime provider",
            },
        });

        if (!response.ok) {
            throw new Error(`GTFS-RT endpoint returned ${response.status}`);
        }

        // GTFS-Realtime VehiclePositions are Protocol Buffers. NexTransit keeps
        // this architecture ready but does not bundle a parser until an official
        // endpoint/key is available for mapping route/trip IDs safely.
        await response.arrayBuffer();

        return {
            provider: "GTFS_RT",
            vehicles: [],
            generatedAt: new Date().toISOString(),
            fallbackUsed: true,
            message: `GTFS-RT endpoint responded for ${routeCode}, but parser/mapping is not configured. Falling back to simulation.`,
        };
    } catch (error) {
        return {
            provider: "GTFS_RT",
            vehicles: [],
            generatedAt: new Date().toISOString(),
            fallbackUsed: true,
            message: error instanceof Error ? error.message : "GTFS-RT provider failed.",
        };
    }
}

async function getSimulationVehiclesForRoute(
    routeCode: string,
): Promise<RealtimeProviderResult> {
    const vehicles = await prisma.vehicle.findMany({
        where: {
            currentRoute: {
                code: routeCode,
            },
            status: {
                not: "OFFLINE",
            },
        },
        include: {
            currentRoute: true,
            positions: {
                take: 1,
                orderBy: { recordedAt: "desc" },
            },
        },
        orderBy: { code: "asc" },
    });

    const realtimeVehicles: RealtimeVehicle[] = vehicles.flatMap((vehicle) => {
        const position = vehicle.positions[0];
        if (!position || !vehicle.currentRoute) return [];

        return [
            {
                id: vehicle.id,
                code: vehicle.code,
                routeCode: vehicle.currentRoute.code,
                latitude: position.latitude,
                longitude: position.longitude,
                speedKmh: position.speedKmh,
                heading: position.heading,
                recordedAt: position.recordedAt.toISOString(),
                source: "SIMULATION",
            },
        ];
    });

    return {
        provider: "SIMULATION",
        vehicles: realtimeVehicles,
        generatedAt: new Date().toISOString(),
        fallbackUsed: false,
    };
}

// TransJakarta live tracking is available to riders through Google Maps, but a
// public raw official GTFS-RT VehiclePositions endpoint is not documented here.
// Do not scrape Google Maps or private endpoints. If TransJakarta, DISHUB, JSC,
// or an operator provides an official feed/key, wire it through the GTFS-RT path.
