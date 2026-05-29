import { getDistanceKm, type Coordinate } from "@/lib/geo";

export type RouteGeometryValidationResult = {
    valid: boolean;
    reason?: string;
    maxJumpKm: number;
    pointCount: number;
};

export function validateRouteGeometry({
    points,
    stops,
    maxJumpKm = 3,
    maxDistanceFromStopsKm = 8,
}: {
    points: Coordinate[];
    stops: Coordinate[];
    maxJumpKm?: number;
    maxDistanceFromStopsKm?: number;
}): RouteGeometryValidationResult {
    const maxConsecutiveJumpKm = getMaxConsecutiveJumpKm(points);
    const pointCount = points.length;

    if (pointCount < 20) {
        return invalid("Geometry has fewer than 20 points.", maxConsecutiveJumpKm, pointCount);
    }

    if (maxConsecutiveJumpKm > maxJumpKm) {
        return invalid(
            `Geometry has a ${maxConsecutiveJumpKm.toFixed(2)} km consecutive jump.`,
            maxConsecutiveJumpKm,
            pointCount,
        );
    }

    const diagonalKm = getBoundingBoxDiagonalKm(points);
    const stopDiagonalKm = getBoundingBoxDiagonalKm(stops);
    if (stopDiagonalKm > 0 && diagonalKm > stopDiagonalKm * 2.5 + 3) {
        return invalid(
            `Geometry bounding box is too large (${diagonalKm.toFixed(2)} km).`,
            maxConsecutiveJumpKm,
            pointCount,
        );
    }

    const farPointCount = countFarPoints(points, stops, maxDistanceFromStopsKm);
    if (farPointCount / pointCount > 0.2) {
        return invalid(
            `${farPointCount} points are too far from route stops.`,
            maxConsecutiveJumpKm,
            pointCount,
        );
    }

    if (appearsClosedLoop(points, stops)) {
        return invalid(
            "Geometry appears closed-loop or area-like.",
            maxConsecutiveJumpKm,
            pointCount,
        );
    }

    if (hasExtremeBacktracking(points, stops)) {
        return invalid(
            "Geometry has extreme backtracking or unrelated branches.",
            maxConsecutiveJumpKm,
            pointCount,
        );
    }

    return {
        valid: true,
        maxJumpKm: maxConsecutiveJumpKm,
        pointCount,
    };
}

export function getMaxConsecutiveJumpKm(points: Coordinate[]) {
    let maxJumpKm = 0;

    for (let index = 0; index < points.length - 1; index += 1) {
        maxJumpKm = Math.max(maxJumpKm, getDistanceKm(points[index], points[index + 1]));
    }

    return maxJumpKm;
}

export function getBoundingBox(points: Coordinate[]) {
    return points.reduce(
        (box, point) => ({
            minLatitude: Math.min(box.minLatitude, point.latitude),
            maxLatitude: Math.max(box.maxLatitude, point.latitude),
            minLongitude: Math.min(box.minLongitude, point.longitude),
            maxLongitude: Math.max(box.maxLongitude, point.longitude),
        }),
        {
            minLatitude: Number.POSITIVE_INFINITY,
            maxLatitude: Number.NEGATIVE_INFINITY,
            minLongitude: Number.POSITIVE_INFINITY,
            maxLongitude: Number.NEGATIVE_INFINITY,
        },
    );
}

export function getBoundingBoxDiagonalKm(points: Coordinate[]) {
    if (points.length < 2) return 0;
    const box = getBoundingBox(points);

    return getDistanceKm(
        { latitude: box.minLatitude, longitude: box.minLongitude },
        { latitude: box.maxLatitude, longitude: box.maxLongitude },
    );
}

export function distanceToNearestStop(point: Coordinate, stops: Coordinate[]) {
    if (stops.length === 0) return Number.POSITIVE_INFINITY;

    return stops.reduce(
        (nearest, stop) => Math.min(nearest, getDistanceKm(point, stop)),
        Number.POSITIVE_INFINITY,
    );
}

export function countFarPoints(
    points: Coordinate[],
    stops: Coordinate[],
    thresholdKm: number,
) {
    return points.filter((point) => distanceToNearestStop(point, stops) > thresholdKm).length;
}

function invalid(
    reason: string,
    maxJumpKm: number,
    pointCount: number,
): RouteGeometryValidationResult {
    return {
        valid: false,
        reason,
        maxJumpKm,
        pointCount,
    };
}

function appearsClosedLoop(points: Coordinate[], stops: Coordinate[]) {
    if (points.length < 3 || stops.length < 2) return false;

    const firstLastDistanceKm = getDistanceKm(points[0], points[points.length - 1]);
    const routeEndDistanceKm = getDistanceKm(stops[0], stops[stops.length - 1]);

    return firstLastDistanceKm < 0.35 && routeEndDistanceKm > 2;
}

function hasExtremeBacktracking(points: Coordinate[], stops: Coordinate[]) {
    if (points.length < 8 || stops.length < 2) return false;

    const start = stops[0];
    const end = stops[stops.length - 1];
    const axisLat = end.latitude - start.latitude;
    const axisLng = end.longitude - start.longitude;
    const axisLength = axisLat * axisLat + axisLng * axisLng || 1;
    let reversalCount = 0;
    let previousProgress: number | null = null;

    for (const point of points) {
        const progress =
            ((point.latitude - start.latitude) * axisLat +
                (point.longitude - start.longitude) * axisLng) /
            axisLength;

        if (previousProgress !== null && progress < previousProgress - 0.08) {
            reversalCount += 1;
        }

        previousProgress = progress;
    }

    return reversalCount > Math.max(5, points.length * 0.08);
}
