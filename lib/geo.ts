export type Coordinate = {
    latitude: number;
    longitude: number;
};

export type LocatedItem = Coordinate & {
    id: string;
};

export function getDistanceKm(from: Coordinate, to: Coordinate) {
    const earthRadiusKm = 6371;

    const dLat = toRadians(to.latitude - from.latitude);
    const dLon = toRadians(to.longitude - from.longitude);

    const lat1 = toRadians(from.latitude);
    const lat2 = toRadians(to.latitude);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
}

export function toRadians(value: number) {
    return (value * Math.PI) / 180;
}

export function findNearestStop<T extends LocatedItem>(
    location: Coordinate,
    stops: T[],
) {
    return findNearest(location, stops);
}

export function findNearestVehicle<T extends LocatedItem>(
    location: Coordinate,
    vehicles: T[],
) {
    return findNearest(location, vehicles);
}

export function interpolatePositionTowardsTarget(
    from: Coordinate,
    to: Coordinate,
    factor = 0.12,
): Coordinate {
    const clampedFactor = Math.min(Math.max(factor, 0), 1);

    return {
        latitude: from.latitude + (to.latitude - from.latitude) * clampedFactor,
        longitude: from.longitude + (to.longitude - from.longitude) * clampedFactor,
    };
}

function findNearest<T extends LocatedItem>(location: Coordinate, items: T[]) {
    if (items.length === 0) return null;

    return items.reduce<{
        item: T;
        distanceKm: number;
    } | null>((nearest, item) => {
        const distanceKm = getDistanceKm(location, item);

        if (!nearest || distanceKm < nearest.distanceKm) {
            return {
                item,
                distanceKm,
            };
        }

        return nearest;
    }, null);
}
