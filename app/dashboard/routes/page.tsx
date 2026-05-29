import Link from "next/link";
import { revalidatePath } from "next/cache";
import type { ReactNode } from "react";
import { z } from "zod";
import { AlertTriangle, Bus, ExternalLink, MapPinned, Route as RouteIcon, Waypoints } from "lucide-react";

import { prisma } from "@/lib/prisma";
import type { RouteType } from "@/lib/generated/prisma/enums";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { StatusBadge } from "@/components/shared/status-badge";

export const dynamic = "force-dynamic";

const routeSchema = z.object({
    modeId: z.string().min(1),
    code: z.string().trim().min(1).max(24),
    name: z.string().trim().min(2).max(120),
    type: z.enum(["BUS", "MRT", "LRT", "FEEDER"]),
    origin: z.string().trim().min(2).max(80),
    destination: z.string().trim().min(2).max(80),
    distanceKm: z.coerce.number().positive(),
});

async function createRoute(formData: FormData) {
    "use server";

    const parsed = routeSchema.safeParse({
        modeId: String(formData.get("modeId") ?? ""),
        code: String(formData.get("code") ?? ""),
        name: String(formData.get("name") ?? ""),
        type: String(formData.get("type") ?? ""),
        origin: String(formData.get("origin") ?? ""),
        destination: String(formData.get("destination") ?? ""),
        distanceKm: formData.get("distanceKm"),
    });

    if (!parsed.success) return;

    await prisma.route.upsert({
        where: { code: parsed.data.code },
        update: {
            modeId: parsed.data.modeId,
            name: parsed.data.name,
            type: parsed.data.type as RouteType,
            origin: parsed.data.origin,
            destination: parsed.data.destination,
            distanceKm: parsed.data.distanceKm,
            isActive: true,
        },
        create: {
            modeId: parsed.data.modeId,
            code: parsed.data.code,
            name: parsed.data.name,
            type: parsed.data.type as RouteType,
            origin: parsed.data.origin,
            destination: parsed.data.destination,
            distanceKm: parsed.data.distanceKm,
            isActive: true,
        },
    });

    revalidatePath("/dashboard/routes");
}

export default async function RoutesPage() {
    const [routes, modes] = await Promise.all([
        prisma.route.findMany({
            orderBy: [{ isActive: "desc" }, { code: "asc" }],
            include: {
                mode: true,
                vehicles: true,
                pathPoints: true,
                schedules: {
                    include: {
                        stop: true,
                    },
                    orderBy: {
                        sequence: "asc",
                    },
                },
            },
        }),
        prisma.transportMode.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
        }),
    ]);

    const activeRoutes = routes.filter((route) => route.isActive);
    const staleRoutes = routes.filter((route) => !route.isActive);
    const totalDistance = activeRoutes.reduce((sum, route) => sum + route.distanceKm, 0);
    const totalFleet = activeRoutes.reduce((sum, route) => sum + route.vehicles.length, 0);
    const totalSchedules = routes.reduce(
        (sum, route) => sum + route.schedules.length,
        0,
    );

    return (
        <div>
            <PageHeading
                label="Routes"
                title="Routes and stops"
                description="Lihat daftar rute, jarak operasional, armada yang terhubung, dan urutan halte/stasiun."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Total Routes"
                    value={activeRoutes.length}
                    description={`${staleRoutes.length} stale/inactive hidden from passenger app`}
                    icon={RouteIcon}
                />
                <MetricCard
                    title="Fleet Assigned"
                    value={totalFleet}
                    description="Vehicles connected to routes"
                    icon={Bus}
                />
                <MetricCard
                    title="Schedule Points"
                    value={totalSchedules}
                    description="Stop schedule entries"
                    icon={Waypoints}
                />
                <MetricCard
                    title="Total Distance"
                    value={`${totalDistance.toFixed(1)} km`}
                    description="Combined active route distance"
                    icon={MapPinned}
                />
            </div>

            <Card className="mt-6 rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                <CardContent className="p-5">
                    <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                        Add or update route
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Create a corridor/line, then manage its stop order in Schedules and
                        rebuild road geometry in Path Builder.
                    </p>
                    <details className="mt-5 rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                        <summary className="cursor-pointer text-sm font-medium">
                            Add new route
                        </summary>
                    <form action={createRoute} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Field label="Mode">
                            <select name="modeId" required className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900">
                                <option value="">Choose mode</option>
                                {modes.map((mode) => (
                                    <option key={mode.id} value={mode.id}>{mode.name}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Route code">
                            <input name="code" required placeholder="K9" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                        </Field>
                        <Field label="Route name">
                            <input name="name" required placeholder="Route name" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                        </Field>
                        <Field label="Type">
                            <select name="type" required className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900">
                                <option value="BUS">BUS</option>
                                <option value="MRT">MRT</option>
                                <option value="LRT">LRT</option>
                                <option value="FEEDER">FEEDER</option>
                            </select>
                        </Field>
                        <Field label="Origin">
                            <input name="origin" required placeholder="Origin" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                        </Field>
                        <Field label="Destination">
                            <input name="destination" required placeholder="Destination" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                        </Field>
                        <Field label="Distance">
                            <input name="distanceKm" required type="number" step="0.1" min="0.1" placeholder="12.9" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                        </Field>
                        <Button className="mt-6 h-10 rounded-xl bg-slate-950 text-white shadow-none dark:bg-white dark:text-slate-950">
                            Save route
                        </Button>
                    </form>
                    </details>
                </CardContent>
            </Card>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {routes.map((route) => (
                    <Card
                        key={route.id}
                        className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950"
                    >
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <StatusBadge status={route.type} />
                                        {route.mode ? <StatusBadge status={route.mode.name} /> : null}
                                        {!route.isActive ? <StatusBadge status="INACTIVE" /> : null}
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {route.code}
                                        </span>
                                    </div>

                                    <h2 className="mt-3 font-[var(--font-jakarta)] text-lg font-semibold">
                                        {route.name}
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {route.origin} → {route.destination}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="font-[var(--font-jakarta)] text-2xl font-semibold">
                                        {route.distanceKm.toFixed(1)}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        km
                                    </p>
                                </div>
                            </div>

                            {!route.mode ? (
                                <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                    Missing transport mode. This route is not ready for passenger demo until a mode is assigned.
                                </div>
                            ) : null}

                            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
                                <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Fleet
                                    </p>
                                    <p className="mt-1 font-semibold">{route.vehicles.length}</p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Stops
                                    </p>
                                    <p className="mt-1 font-semibold">{route.schedules.length}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Path points
                                    </p>
                                    <p className="mt-1 font-semibold">{route.pathPointCount || route.pathPoints.length}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Path source
                                    </p>
                                    <p className="mt-1 font-semibold">{route.pathSource ?? "UNKNOWN"}</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Status
                                    </p>
                                    <p className="mt-1 font-semibold">{route.isActive ? "Active" : "Inactive"}</p>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-2">
                                {route.isActive && route.mode && route.schedules.length > 0 && (route.pathPointCount || route.pathPoints.length) > 1 ? (
                                    <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-transparent">
                                        <Link href={`/passenger/routes/${route.id}`}>
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            View live
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button disabled variant="outline" className="rounded-xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-transparent">
                                        View live unavailable
                                    </Button>
                                )}
                                <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-transparent">
                                    <Link href={`/dashboard/path-builder?routeId=${route.id}`}>Rebuild path</Link>
                                </Button>
                                <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-transparent">
                                    <Link href={`/dashboard/schedules?routeId=${route.id}`}>Manage stops</Link>
                                </Button>
                            </div>

                            <div className="mt-5 space-y-2">
                                {route.schedules.map((schedule) => (
                                    <div
                                        key={schedule.id}
                                        className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-white/10"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">{schedule.stop.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Stop #{schedule.sequence}
                                            </p>
                                        </div>

                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {schedule.arrivalTime}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <label className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {label}
            </span>
            {children}
        </label>
    );
}
