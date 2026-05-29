import type { Coordinate } from "@/lib/geo";
import { dedupeCoordinates, sleep } from "@/lib/routing/geometry";

type OverpassElement = {
    type: string;
    id: number;
    geometry?: Array<{
        lat: number;
        lon: number;
    }>;
};

type OverpassResponse = {
    elements?: OverpassElement[];
};

export async function fetchOverpassRailGeometry(query: string): Promise<Coordinate[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    try {
        await sleep(600);
        const response = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: query,
            signal: controller.signal,
            headers: {
                "Content-Type": "text/plain;charset=UTF-8",
                "User-Agent": "NexTransit MVP rail geometry generator",
            },
        });

        if (!response.ok) {
            throw new Error(`Overpass returned ${response.status}`);
        }

        const data = (await response.json()) as OverpassResponse;
        const points =
            data.elements
                ?.filter((element) => element.type === "way" && element.geometry)
                .flatMap((element) =>
                    element.geometry!.map((point) => ({
                        latitude: point.lat,
                        longitude: point.lon,
                    })),
                ) ?? [];

        return dedupeCoordinates(points, 8);
    } finally {
        clearTimeout(timeout);
    }
}
