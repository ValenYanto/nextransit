import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ message: "Not available in production." }, { status: 404 });
    }

    const routes = await prisma.route.findMany({
        orderBy: [{ isActive: "desc" }, { code: "asc" }],
        include: {
            mode: true,
            schedules: true,
            vehicles: {
                where: { status: { not: "OFFLINE" } },
            },
            pathPoints: {
                select: { id: true },
            },
        },
    });

    return NextResponse.json({
        routes: routes.map((route) => {
            const issues: string[] = [];
            const stopCount = route.schedules.length;
            const vehicleCount = route.vehicles.length;
            const pathPointCount = route.pathPointCount || route.pathPoints.length;

            if (!route.mode) issues.push("missing mode");
            if (stopCount === 0) issues.push("no stops");
            if (pathPointCount <= 1) issues.push("no path points");
            if (vehicleCount === 0) issues.push("no vehicles");
            if (!route.isActive) issues.push("inactive");
            if (!route.isActive || !route.mode || stopCount === 0 || pathPointCount <= 1) {
                issues.push("view live unavailable");
            }

            return {
                id: route.id,
                code: route.code,
                name: route.name,
                active: route.isActive,
                modeName: route.mode?.name ?? null,
                stopCount,
                vehicleCount,
                pathPointCount,
                pathSource: route.pathSource,
                liveUrl: `/passenger/routes/${route.id}`,
                issues,
            };
        }),
    });
}
