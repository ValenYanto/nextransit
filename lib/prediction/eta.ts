export type TrafficLevel = "LOW" | "MEDIUM" | "HIGH";
export type CrowdLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type CalculateEtaParams = {
    distanceKm: number;
    averageSpeedKmh: number;
    trafficLevel: TrafficLevel;
    crowdLevel?: CrowdLevel;
};

const trafficDelayMap: Record<TrafficLevel, number> = {
    LOW: 1,
    MEDIUM: 5,
    HIGH: 10,
};

const crowdDelayMap: Record<CrowdLevel, number> = {
    LOW: 0,
    MEDIUM: 2,
    HIGH: 5,
    CRITICAL: 8,
};

export function calculateEtaMinutes({
    distanceKm,
    averageSpeedKmh,
    trafficLevel,
    crowdLevel = "LOW",
}: CalculateEtaParams) {
    const safeSpeed = Math.max(averageSpeedKmh, 5);
    const baseMinutes = (distanceKm / safeSpeed) * 60;

    const trafficDelay = trafficDelayMap[trafficLevel];
    const crowdDelay = crowdDelayMap[crowdLevel];

    return Math.max(1, Math.round(baseMinutes + trafficDelay + crowdDelay));
}

export function getTrafficLevelBySpeed(speedKmh: number): TrafficLevel {
    if (speedKmh >= 30) return "LOW";
    if (speedKmh >= 15) return "MEDIUM";
    return "HIGH";
}

export function getEtaConfidence(trafficLevel: TrafficLevel, crowdLevel: CrowdLevel) {
    let confidence = 0.92;

    if (trafficLevel === "MEDIUM") confidence -= 0.06;
    if (trafficLevel === "HIGH") confidence -= 0.12;

    if (crowdLevel === "MEDIUM") confidence -= 0.04;
    if (crowdLevel === "HIGH") confidence -= 0.08;
    if (crowdLevel === "CRITICAL") confidence -= 0.12;

    return Math.max(0.65, Number(confidence.toFixed(2)));
}

export function formatEta(minutes: number) {
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) return `${hours} h`;

    return `${hours} h ${remainingMinutes} min`;
}