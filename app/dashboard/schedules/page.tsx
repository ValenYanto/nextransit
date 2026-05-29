import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CalendarClock, ListOrdered, MapPin } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { StatusBadge } from "@/components/shared/status-badge";

export const dynamic = "force-dynamic";

const scheduleSchema = z.object({
    routeId: z.string().min(1),
    stopId: z.string().min(1),
    sequence: z.coerce.number().int().positive(),
    arrivalTime: z.string().trim().min(1),
    departureTime: z.string().trim().min(1),
});

async function saveSchedule(formData: FormData) {
    "use server";

    const parsed = scheduleSchema.safeParse({
        routeId: String(formData.get("routeId") ?? ""),
        stopId: String(formData.get("stopId") ?? ""),
        sequence: formData.get("sequence"),
        arrivalTime: String(formData.get("arrivalTime") ?? ""),
        departureTime: String(formData.get("departureTime") ?? ""),
    });

    if (!parsed.success) return;

    await prisma.schedule.upsert({
        where: {
            routeId_sequence: {
                routeId: parsed.data.routeId,
                sequence: parsed.data.sequence,
            },
        },
        update: {
            stopId: parsed.data.stopId,
            arrivalTime: parsed.data.arrivalTime,
            departureTime: parsed.data.departureTime,
        },
        create: parsed.data,
    });

    revalidatePath("/dashboard/schedules");
    revalidatePath("/dashboard/routes");
}

export default async function SchedulesPage() {
    const [routes, stops] = await Promise.all([
        prisma.route.findMany({
            orderBy: { code: "asc" },
            include: {
                schedules: {
                    orderBy: { sequence: "asc" },
                    include: { stop: true },
                },
            },
        }),
        prisma.stop.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
        }),
    ]);

    const scheduleCount = routes.reduce((sum, route) => sum + route.schedules.length, 0);
    const routesWithStops = routes.filter((route) => route.schedules.length > 1).length;

    return (
        <div>
            <PageHeading
                label="Schedules"
                title="Route stop order"
                description="Manage route-stop ordering used for ETA logic, journey planning, and route geometry generation."
            />

            <div className="grid gap-4 md:grid-cols-3">
                <MetricCard title="Schedule Entries" value={scheduleCount} description="Ordered stop records" icon={CalendarClock} />
                <MetricCard title="Routes Ready" value={routesWithStops} description="Can rebuild path geometry" icon={ListOrdered} />
                <MetricCard title="Available Stops" value={stops.length} description="Active stop registry" icon={MapPin} />
            </div>

            <Card className="mt-6 rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                <CardContent className="p-5">
                    <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                        Add or update stop order
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Reusing a route and sequence updates that slot. Rebuild the route
                        path after changing stop order.
                    </p>
                    <form action={saveSchedule} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                        <select name="routeId" required className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900">
                            <option value="">Route</option>
                            {routes.map((route) => (
                                <option key={route.id} value={route.id}>{route.code} · {route.name}</option>
                            ))}
                        </select>
                        <select name="stopId" required className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900">
                            <option value="">Stop</option>
                            {stops.map((stop) => (
                                <option key={stop.id} value={stop.id}>{stop.name} ({stop.code})</option>
                            ))}
                        </select>
                        <input name="sequence" required type="number" min="1" placeholder="Sequence" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                        <input name="arrivalTime" required placeholder="08:00" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                        <input name="departureTime" required placeholder="08:02" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                        <Button className="h-10 rounded-xl bg-slate-950 text-white shadow-none dark:bg-white dark:text-slate-950">
                            Save order
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {routes.map((route) => (
                    <Card key={route.id} className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <StatusBadge status={route.type} />
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{route.code}</span>
                                    </div>
                                    <h2 className="mt-3 font-[var(--font-jakarta)] text-lg font-semibold">{route.name}</h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {route.origin} to {route.destination}
                                    </p>
                                </div>
                                <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                                    {route.schedules.length} stops
                                </span>
                            </div>
                            <div className="mt-5 space-y-2">
                                {route.schedules.map((schedule) => (
                                    <div key={schedule.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 dark:border-white/10">
                                        <div>
                                            <p className="text-sm font-medium">{schedule.sequence}. {schedule.stop.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{schedule.stop.type} · {schedule.stop.area ?? "Jakarta"}</p>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{schedule.arrivalTime}</p>
                                    </div>
                                ))}
                                {route.schedules.length === 0 ? (
                                    <p className="rounded-xl border border-slate-200 p-3 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                                        No stop order yet.
                                    </p>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
