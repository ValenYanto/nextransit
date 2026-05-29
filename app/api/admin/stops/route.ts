import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import type { StopType } from "@/lib/generated/prisma/enums";

const stopSchema = z.object({
    code: z.string().trim().min(1).max(32),
    name: z.string().trim().min(2).max(120),
    type: z.enum(["BUS_STOP", "STATION", "TERMINAL"]),
    area: z.string().trim().optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    isActive: z.boolean().optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = stopSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { message: "Please enter a valid stop name, code, and map point." },
                { status: 400 },
            );
        }

        const stop = await prisma.stop.upsert({
            where: { code: parsed.data.code },
            update: {
                name: parsed.data.name,
                type: parsed.data.type as StopType,
                area: parsed.data.area || null,
                latitude: parsed.data.latitude,
                longitude: parsed.data.longitude,
                isActive: parsed.data.isActive ?? true,
            },
            create: {
                code: parsed.data.code,
                name: parsed.data.name,
                type: parsed.data.type as StopType,
                area: parsed.data.area || null,
                latitude: parsed.data.latitude,
                longitude: parsed.data.longitude,
                isActive: parsed.data.isActive ?? true,
            },
        });

        return NextResponse.json({
            stop: {
                id: stop.id,
                code: stop.code,
                name: stop.name,
                type: stop.type,
                area: stop.area,
                latitude: stop.latitude,
                longitude: stop.longitude,
            },
        });
    } catch (error) {
        console.error("[ADMIN_CREATE_STOP_ERROR]", error);
        return NextResponse.json(
            { message: "Failed to save stop." },
            { status: 500 },
        );
    }
}
