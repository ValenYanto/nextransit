import type { Coordinate } from "@/lib/geo";
import { dedupeCoordinates, interpolateLine, sleep } from "@/lib/routing/geometry";

export type RouteSegmentResult = {
    points: Coordinate[];
    source: "OSRM" | "FALLBACK";
    distanceMeters?: number;
    durationSeconds?: number;
    error?: string;
};

type OsrmRoute = {
    routes?: Array<{
        distance?: number;
        duration?: number;
        geometry?: {
            coordinates?: Array<[number, number]>;
        };
    }>;
};

export async function getOsrmRouteSegment({
    from,
    to,
    profile = "driving",
}: {
    from: Coordinate;
    to: Coordinate;
    profile?: "driving" | "walking";
}): Promise<RouteSegmentResult> {
    const url = new URL(
        `https://router.project-osrm.org/route/v1/${profile}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}`,
    );
    url.searchParams.set("overview", "full");
    url.searchParams.set("geometries", "geojson");
    url.searchParams.set("steps", "false");

    try {
        await sleep(650);
        const response = await fetch(url, {
            headers: {
                "User-Agent": "NexTransit MVP route geometry generator",
            },
        });

        if (!response.ok) {
            throw new Error(`OSRM returned ${response.status}`);
        }

        const data = (await response.json()) as OsrmRoute;
        const route = data.routes?.[0];
        const coordinates = route?.geometry?.coordinates;

        if (!coordinates || coordinates.length < 2) {
            throw new Error("OSRM response has no route geometry.");
        }

        return {
            points: dedupeCoordinates(
                coordinates.map(([longitude, latitude]) => ({ latitude, longitude })),
                10,
            ),
            source: "OSRM",
            distanceMeters: route?.distance,
            durationSeconds: route?.duration,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown OSRM error";
        return {
            points: interpolateLine(from, to, 14),
            source: "FALLBACK",
            error: message,
        };
    }
}
