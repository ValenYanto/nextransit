import type { Coordinate } from "@/lib/geo";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { concatenateSegments, sleep } from "@/lib/routing/geometry";
import { validateRouteGeometry } from "@/lib/routing/geometry-validation";
import { getRouteSegment } from "@/lib/routing/provider";
import { getRailRoutePath } from "@/lib/routing/rail";
import { getCuratedRailPath } from "@/lib/routing/rail-curated-paths";

export type RoutePathSource = "OSRM" | "MIXED" | "FALLBACK" | "MANUAL" | "RAIL_OSM" | "RAIL_MANUAL";

export type RoutePathSegmentReport = {
    from: string;
    to: string;
    source: "OSRM" | "FALLBACK" | "MANUAL" | "RAIL_OSM" | "RAIL_MANUAL";
    pointCount: number;
    distanceMeters?: number;
    durationSeconds?: number;
    error?: string;
};

export type RoutePathRebuildReport = {
    routeId: string;
    routeCode: string;
    source: RoutePathSource;
    pathPointCount: number;
    segmentReports: RoutePathSegmentReport[];
};

type RebuildOptions = {
    log?: boolean;
};

export async function rebuildRoutePathFromSchedules(
    prisma: PrismaClient,
    routeId: string,
    _options: RebuildOptions = {},
): Promise<RoutePathRebuildReport> {
    void _options;

    const route = await prisma.route.findUnique({
        where: { id: routeId },
        include: {
            schedules: {
                orderBy: { sequence: "asc" },
                include: { stop: true },
            },
        },
    });

    if (!route) {
        throw new Error(`Route ${routeId} not found.`);
    }

    if (route.schedules.length < 2) {
        throw new Error(`Route ${route.code} requires at least two ordered stops.`);
    }

    if (route.type === "MRT" || route.type === "LRT") {
        const result = await getRailRoutePath({
            routeCode: route.code,
            routeName: route.name,
            stops: route.schedules.map((schedule) => ({
                name: schedule.stop.name,
                latitude: schedule.stop.latitude,
                longitude: schedule.stop.longitude,
                sequence: schedule.sequence,
            })),
        });
        const stopCoordinates = route.schedules.map((schedule) => ({
            latitude: schedule.stop.latitude,
            longitude: schedule.stop.longitude,
        }));
        const validation = validateRouteGeometry({
            points: result.points,
            stops: stopCoordinates,
            maxJumpKm: route.type === "MRT" ? 2.5 : 4,
            maxDistanceFromStopsKm: route.type === "MRT" ? 4 : 18,
        });
        const finalResult = validation.valid
            ? result
            : {
                points: getCuratedRailPath(route.code),
                source: "RAIL_MANUAL" as const,
                error: validation.reason,
            };
        const safePoints = stripClosingDuplicate(finalResult.points);

        await replaceRoutePath(prisma, route.id, safePoints, finalResult.source);

        return {
            routeId: route.id,
            routeCode: route.code,
            source: finalResult.source,
            pathPointCount: safePoints.length,
            segmentReports: [
                {
                    from: route.schedules[0].stop.name,
                    to: route.schedules[route.schedules.length - 1].stop.name,
                    source: finalResult.source,
                    pointCount: safePoints.length,
                    error: finalResult.error,
                },
            ],
        };
    }

    const segmentReports: RoutePathSegmentReport[] = [];
    const segments: Coordinate[][] = [];

    for (let index = 0; index < route.schedules.length - 1; index += 1) {
        const from = route.schedules[index].stop;
        const to = route.schedules[index + 1].stop;

        const result = await getRouteSegment({
            from,
            to,
            profile: "driving",
        });

        segments.push(result.points);
        segmentReports.push({
            from: from.name,
            to: to.name,
            source: result.source,
            pointCount: result.points.length,
            distanceMeters: result.distanceMeters,
            durationSeconds: result.durationSeconds,
            error: result.error,
        });

        await sleep(650);
    }

    const pathPoints = concatenateSegments(segments);
    const source = resolvePathSource(route.type, segmentReports);

    await replaceRoutePath(prisma, route.id, pathPoints, source);

    return {
        routeId: route.id,
        routeCode: route.code,
        source,
        pathPointCount: pathPoints.length,
        segmentReports,
    };
}

function stripClosingDuplicate(points: Coordinate[]) {
    if (points.length < 3) return points;
    const first = points[0];
    const last = points[points.length - 1];
    const same =
        Math.abs(first.latitude - last.latitude) < 0.00001 &&
        Math.abs(first.longitude - last.longitude) < 0.00001;

    return same ? points.slice(0, -1) : points;
}

function resolvePathSource(
    routeType: string,
    reports: RoutePathSegmentReport[],
): RoutePathSource {
    const osrmCount = reports.filter((report) => report.source === "OSRM").length;
    const fallbackCount = reports.filter((report) => report.source === "FALLBACK").length;

    if (osrmCount > 0 && fallbackCount === 0) return "OSRM";
    if (osrmCount > 0 && fallbackCount > 0) return "MIXED";
    return "FALLBACK";
}

async function replaceRoutePath(
    prisma: PrismaClient,
    routeId: string,
    pathPoints: Coordinate[],
    pathSource: RoutePathSource,
) {
    await prisma.$transaction([
        prisma.routePathPoint.deleteMany({ where: { routeId } }),
        prisma.routePathPoint.createMany({
            data: pathPoints.map((point, index) => ({
                routeId,
                latitude: point.latitude,
                longitude: point.longitude,
                sequence: index + 1,
            })),
        }),
        prisma.route.update({
            where: { id: routeId },
            data: {
                pathSource,
                pathUpdatedAt: new Date(),
                pathPointCount: pathPoints.length,
            },
        }),
    ]);
}
