import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const modeId = searchParams.get("modeId");

        const routes = await prisma.route.findMany({
            where: {
                isActive: true,
                ...(modeId ? { modeId } : {}),
            },
            orderBy: [{ type: "asc" }, { code: "asc" }],
            include: {
                mode: true,
                _count: {
                    select: {
                        vehicles: true,
                        schedules: true,
                    },
                },
            },
        });

        return NextResponse.json({
            routes: routes.map((route) => ({
                id: route.id,
                code: route.code,
                name: route.name,
                type: route.type,
                origin: route.origin,
                destination: route.destination,
                distanceKm: route.distanceKm,
                mode: route.mode
                    ? {
                        id: route.mode.id,
                        name: route.mode.name,
                        slug: route.mode.slug,
                        color: route.mode.color,
                        icon: route.mode.icon,
                    }
                    : null,
                vehicleCount: route._count.vehicles,
                stopCount: route._count.schedules,
            })),
        });
    } catch (error) {
        console.error("[PASSENGER_ROUTES_ERROR]", error);
        return NextResponse.json(
            { message: "Failed to load passenger routes." },
            { status: 500 },
        );
    }
}
