import type { Coordinate } from "@/lib/geo";
import { dedupeCoordinates } from "@/lib/routing/geometry";
import { validateRouteGeometry } from "@/lib/routing/geometry-validation";
import { fetchOverpassRailGeometry } from "@/lib/routing/overpass";
import { getCuratedRailPath } from "@/lib/routing/rail-curated-paths";

export type RailPathResult = {
    points: Coordinate[];
    source: "RAIL_OSM" | "RAIL_MANUAL" | "FALLBACK";
    error?: string;
};

type RailStop = {
    name: string;
    latitude: number;
    longitude: number;
    sequence: number;
};

export async function getRailRoutePath({
    routeCode,
    routeName,
    stops,
}: {
    routeCode: string;
    routeName: string;
    stops: RailStop[];
}): Promise<RailPathResult> {
    const stopCoordinates = [...stops]
        .sort((a, b) => a.sequence - b.sequence)
        .map((stop) => ({
            latitude: stop.latitude,
            longitude: stop.longitude,
        }));

    if (routeCode === "LRT-DJ") {
        return buildCuratedRailResult(routeCode, routeName, stopCoordinates, "LRT Overpass geometry is disabled for MVP because broad OSM light-rail queries can return unordered branches.");
    }

    try {
        const osmPoints = await fetchOverpassRailGeometry(buildOverpassQuery(routeCode));
        const orderedPoints = orderRailPointsByStopProgress(osmPoints, stops);
        const validation = validateRouteGeometry({
            points: orderedPoints,
            stops: stopCoordinates,
            maxJumpKm: routeCode === "MRT-NS" ? 2.5 : 4,
            maxDistanceFromStopsKm: routeCode === "MRT-NS" ? 4 : 18,
        });

        if (validation.valid) {
            return {
                points: orderedPoints,
                source: "RAIL_OSM",
            };
        }

        return buildCuratedRailResult(routeCode, routeName, stopCoordinates, validation.reason);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Overpass rail query failed.";
        return buildCuratedRailResult(routeCode, routeName, stopCoordinates, message);
    }
}

function buildCuratedRailResult(
    routeCode: string,
    routeName: string,
    fallbackStops: Coordinate[],
    error?: string,
): RailPathResult {
    const curated = getCuratedRailPath(routeCode);
    if (curated.length > 0) {
        return {
            points: curated,
            source: "RAIL_MANUAL",
            error,
        };
    }

    return {
        points: dedupeCoordinates(
            fallbackStops,
            8,
        ),
        source: "FALLBACK",
        error: `No rail geometry available for ${routeName}.`,
    };
}

function buildOverpassQuery(routeCode: string) {
    const railFilter =
        routeCode === "MRT-NS"
            ? `
                way["railway"~"subway|light_rail"]["name"~"MRT|Jakarta|North|South",i](-6.32,106.74,-6.17,106.85);
                relation["route"="subway"]["name"~"MRT|Jakarta|North|South",i](-6.32,106.74,-6.17,106.85);
              `
            : `
                way["railway"~"light_rail|rail"]["name"~"LRT|Jabodebek|Bekasi|Cawang|Jati",i](-6.31,106.80,-6.16,107.08);
                relation["route"~"light_rail|train"]["name"~"LRT|Jabodebek|Bekasi|Cawang|Jati",i](-6.31,106.80,-6.16,107.08);
              `;

    return `
        [out:json][timeout:8];
        (
            ${railFilter}
        );
        out geom;
    `;
}

function orderRailPointsByStopProgress(points: Coordinate[], stops: RailStop[]) {
    if (points.length === 0 || stops.length < 2) return points;

    const orderedStops = [...stops].sort((a, b) => a.sequence - b.sequence);
    const start = orderedStops[0];
    const end = orderedStops[orderedStops.length - 1];
    const axisLat = end.latitude - start.latitude;
    const axisLng = end.longitude - start.longitude;
    const axisLength = axisLat * axisLat + axisLng * axisLng || 1;

    return [...points].sort((a, b) => {
        const progressA =
            ((a.latitude - start.latitude) * axisLat + (a.longitude - start.longitude) * axisLng) /
            axisLength;
        const progressB =
            ((b.latitude - start.latitude) * axisLat + (b.longitude - start.longitude) * axisLng) /
            axisLength;

        return progressA - progressB;
    });
}
