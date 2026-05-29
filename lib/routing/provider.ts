import type { Coordinate } from "@/lib/geo";
import { getOsrmRouteSegment, type RouteSegmentResult } from "@/lib/routing/osrm";

// Map provider and routing provider are separate. Leaflet/OpenStreetMap renders
// the visual map, while OSRM generates route geometry. This provider can later
// be swapped to Google Routes/Roads, Mapbox, HERE, OpenRouteService, or self-hosted OSRM.
export function getRouteSegment(params: {
    from: Coordinate;
    to: Coordinate;
    profile?: "driving" | "walking";
}): Promise<RouteSegmentResult> {
    return getOsrmRouteSegment(params);
}
