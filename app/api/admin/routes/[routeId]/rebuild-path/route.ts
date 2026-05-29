import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rebuildRoutePathFromSchedules } from "@/lib/routing/rebuild-route-path";

export async function POST(
    _request: Request,
    context: { params: Promise<{ routeId: string }> },
) {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "OPERATOR"].includes(session.user.role)) {
        return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    try {
        const { routeId } = await context.params;
        const report = await rebuildRoutePathFromSchedules(prisma, routeId, {
            log: process.env.NODE_ENV === "development",
        });

        return NextResponse.json(report);
    } catch (error) {
        console.error("[ADMIN_REBUILD_ROUTE_PATH_ERROR]", error);
        const message =
            error instanceof Error ? error.message : "Failed to rebuild route path.";

        return NextResponse.json({ message }, { status: 500 });
    }
}
