import { getDistanceKm, type Coordinate } from "@/lib/geo";

export function interpolateLine(
    from: Coordinate,
    to: Coordinate,
    steps = 12,
): Coordinate[] {
    const safeSteps = Math.max(2, steps);

    return Array.from({ length: safeSteps + 1 }, (_, index) => {
        const ratio = index / safeSteps;

        return {
            latitude: Number((from.latitude + (to.latitude - from.latitude) * ratio).toFixed(6)),
            longitude: Number((from.longitude + (to.longitude - from.longitude) * ratio).toFixed(6)),
        };
    });
}

export function dedupeCoordinates(points: Coordinate[], minDistanceMeters = 12) {
    return points.reduce<Coordinate[]>((deduped, point) => {
        const previous = deduped[deduped.length - 1];

        if (!previous || getDistanceKm(previous, point) * 1000 >= minDistanceMeters) {
            deduped.push(point);
        }

        return deduped;
    }, []);
}

export function concatenateSegments(segments: Coordinate[][]) {
    return dedupeCoordinates(segments.flat(), 8);
}

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function findNearestPathPointIndex(
    position: Coordinate,
    pathPoints: Coordinate[],
) {
    if (pathPoints.length === 0) return -1;

    return pathPoints.reduce((bestIndex, point, index) => {
        const bestPoint = pathPoints[bestIndex];
        const distance = getDistanceKm(position, point);
        const bestDistance = getDistanceKm(position, bestPoint);

        return distance < bestDistance ? index : bestIndex;
    }, 0);
}

export function moveAlongPath(
    currentPosition: Coordinate,
    pathPoints: Coordinate[],
    stepSize = 1,
) {
    if (pathPoints.length === 0) return null;

    const nearestIndex = findNearestPathPointIndex(currentPosition, pathPoints);
    if (nearestIndex < 0) return pathPoints[0];

    const nextIndex = nearestIndex + Math.max(1, stepSize);
    return pathPoints[nextIndex >= pathPoints.length ? 0 : nextIndex];
}
