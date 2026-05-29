import { getDistanceKm, type Coordinate } from "@/lib/geo";
import {
    calculateEtaMinutes,
    formatEta,
    getEtaConfidence,
    type CrowdLevel,
    type TrafficLevel,
} from "@/lib/prediction/eta";

export type StopPoint = Coordinate & {
    id: string;
    code?: string;
    name: string;
    type?: string;
    area?: string | null;
    sequence: number;
    arrivalTime?: string;
    departureTime?: string;
};

export type VehiclePoint = Coordinate & {
    speedKmh: number;
};

export function getCrowdLevel(passengerCount: number, capacity: number): CrowdLevel {
    const ratio = capacity > 0 ? passengerCount / capacity : 0;

    if (ratio >= 0.9) return "CRITICAL";
    if (ratio >= 0.7) return "HIGH";
    if (ratio >= 0.4) return "MEDIUM";
    return "LOW";
}

export function getTrafficLevel(speedKmh: number): TrafficLevel {
    if (speedKmh >= 30) return "LOW";
    if (speedKmh >= 15) return "MEDIUM";
    return "HIGH";
}

export type VehicleDirection = "OUTBOUND" | "INBOUND";

export function findNextStop(
    position: Coordinate,
    stops: StopPoint[],
    direction: VehicleDirection = "OUTBOUND",
) {
    if (stops.length === 0) return null;

    const nearestIndex = stops.reduce((bestIndex, stop, index) => {
        const bestStop = stops[bestIndex];
        const distance = getDistanceKm(position, stop);
        const bestDistance = getDistanceKm(position, bestStop);

        return distance < bestDistance ? index : bestIndex;
    }, 0);

    if (direction === "INBOUND") {
        return stops[Math.max(nearestIndex - 1, 0)] ?? stops[0];
    }

    return stops[Math.min(nearestIndex + 1, stops.length - 1)] ?? stops[stops.length - 1];
}

export function buildEtaToStop({
    position,
    stop,
    crowdLevel,
}: {
    position: VehiclePoint;
    stop: Coordinate;
    crowdLevel: CrowdLevel;
}) {
    const distanceKm = getDistanceKm(position, stop);
    const trafficLevel = getTrafficLevel(position.speedKmh);
    const etaMinutes = calculateEtaMinutes({
        distanceKm,
        averageSpeedKmh: position.speedKmh || 18,
        trafficLevel,
        crowdLevel,
    });

    return {
        distanceKm,
        trafficLevel,
        etaMinutes,
        etaFormatted: formatEta(etaMinutes),
        confidence: getEtaConfidence(trafficLevel, crowdLevel),
    };
}
