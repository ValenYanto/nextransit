import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const modes = await prisma.transportMode.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: {
                        routes: {
                            where: { isActive: true },
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            modes: modes.map((mode) => ({
                id: mode.id,
                name: mode.name,
                slug: mode.slug,
                description: mode.description,
                color: mode.color,
                icon: mode.icon,
                routeCount: mode._count.routes,
            })),
        });
    } catch (error) {
        console.error("[PASSENGER_MODES_ERROR]", error);
        return NextResponse.json(
            { message: "Failed to load transport modes." },
            { status: 500 },
        );
    }
}
