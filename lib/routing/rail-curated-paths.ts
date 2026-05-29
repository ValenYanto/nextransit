import type { Coordinate } from "@/lib/geo";
import { concatenateSegments, interpolateLine } from "@/lib/routing/geometry";

const curatedRailAnchors: Record<string, Coordinate[]> = {
    "MRT-NS": [
        { latitude: -6.2892, longitude: 106.7747 },
        { latitude: -6.2903, longitude: 106.7791 },
        { latitude: -6.2915, longitude: 106.7851 },
        { latitude: -6.2929, longitude: 106.7936 },
        { latitude: -6.2858, longitude: 106.7946 },
        { latitude: -6.2789, longitude: 106.7957 },
        { latitude: -6.2722, longitude: 106.7968 },
        { latitude: -6.2659, longitude: 106.7978 },
        { latitude: -6.2605, longitude: 106.7986 },
        { latitude: -6.2540, longitude: 106.7994 },
        { latitude: -6.2484, longitude: 106.8000 },
        { latitude: -6.2446, longitude: 106.8006 },
        { latitude: -6.2416, longitude: 106.7997 },
        { latitude: -6.2389, longitude: 106.7988 },
        { latitude: -6.2342, longitude: 106.7999 },
        { latitude: -6.2299, longitude: 106.8013 },
        { latitude: -6.2267, longitude: 106.8027 },
        { latitude: -6.2224, longitude: 106.8051 },
        { latitude: -6.2181, longitude: 106.8076 },
        { latitude: -6.2141, longitude: 106.8101 },
        { latitude: -6.2103, longitude: 106.8127 },
        { latitude: -6.2058, longitude: 106.8158 },
        { latitude: -6.2015, longitude: 106.8195 },
        { latitude: -6.2008, longitude: 106.8229 },
        { latitude: -6.1981, longitude: 106.8231 },
        { latitude: -6.1955, longitude: 106.8231 },
        { latitude: -6.1931, longitude: 106.8230 },
    ],
    "LRT-DJ": [
        { latitude: -6.2008, longitude: 106.8229 },
        { latitude: -6.2054, longitude: 106.8292 },
        { latitude: -6.2146, longitude: 106.8339 },
        { latitude: -6.2242, longitude: 106.8388 },
        { latitude: -6.2340, longitude: 106.8427 },
        { latitude: -6.2434, longitude: 106.8467 },
        { latitude: -6.2498, longitude: 106.8585 },
        { latitude: -6.2556, longitude: 106.8707 },
        { latitude: -6.2532, longitude: 106.8815 },
        { latitude: -6.2502, longitude: 106.8913 },
        { latitude: -6.2514, longitude: 106.9078 },
        { latitude: -6.2540, longitude: 106.9214 },
        { latitude: -6.2572, longitude: 106.9312 },
        { latitude: -6.2587, longitude: 106.9567 },
        { latitude: -6.2617, longitude: 106.9833 },
        { latitude: -6.2667, longitude: 107.0138 },
        { latitude: -6.2731, longitude: 107.0375 },
    ],
};

export function getCuratedRailPath(routeCode: string): Coordinate[] {
    const anchors = curatedRailAnchors[routeCode];
    if (!anchors) return [];

    return concatenateSegments(
        anchors.slice(0, -1).map((anchor, index) =>
            interpolateLine(anchor, anchors[index + 1], routeCode === "LRT-DJ" ? 6 : 5),
        ),
    );
}
