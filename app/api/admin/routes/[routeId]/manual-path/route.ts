import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const manualPathSchema = z.object({
    points: z
        .array(
            z.object({
                latitude: z.number().min(-90).max(90),
                longitude: z.number().min(-180).max(180),
                sequence: z.number().int().positive().optional(),
            }),
        )
        .min(2)
        .max(2000),
});

export async function POST(
    request: Request,
    context: { params: Promise<{ routeId: string }> },
) {
    try {
        const { routeId } = await context.params;
        const body = await request.json();
        const parsed = manualPathSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { message: "Add at least two valid map points before saving." },
                { status: 400 },
            );
        }

        const route = await prisma.route.findUnique({
            where: { id: routeId },
            select: { id: true },
        });

        if (!route) {
            return NextResponse.json({ message: "Route not found." }, { status: 404 });
        }

        const points = parsed.data.points.map((point, index) => ({
            routeId,
            latitude: point.latitude,
            longitude: point.longitude,
            sequence: index + 1,
        }));

        await prisma.$transaction([
            prisma.routePathPoint.deleteMany({ where: { routeId } }),
            prisma.routePathPoint.createMany({ data: points }),
            prisma.route.update({
                where: { id: routeId },
                data: {
                    pathSource: "MANUAL_CLICKED",
                    pathPointCount: points.length,
                    pathUpdatedAt: new Date(),
                },
            }),
        ]);

        return NextResponse.json({
            routeId,
            pathSource: "MANUAL_CLICKED",
            pathPointCount: points.length,
            message: "Manual path saved.",
        });
    } catch (error) {
        console.error("[ADMIN_MANUAL_PATH_ERROR]", error);
        return NextResponse.json(
            { message: "Failed to save manual path." },
            { status: 500 },
        );
    }
}
