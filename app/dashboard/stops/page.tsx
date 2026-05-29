import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MapPin, Route, Waypoints } from "lucide-react";

import { prisma } from "@/lib/prisma";
import type { StopType } from "@/lib/generated/prisma/enums";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { StatusBadge } from "@/components/shared/status-badge";

export const dynamic = "force-dynamic";

const stopSchema = z.object({
    code: z.string().trim().min(1).max(32),
    name: z.string().trim().min(2).max(120),
    type: z.enum(["BUS_STOP", "STATION", "TERMINAL"]),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    area: z.string().trim().optional(),
});

async function createStop(formData: FormData) {
    "use server";

    const parsed = stopSchema.safeParse({
        code: String(formData.get("code") ?? ""),
        name: String(formData.get("name") ?? ""),
        type: String(formData.get("type") ?? ""),
        latitude: formData.get("latitude"),
        longitude: formData.get("longitude"),
        area: String(formData.get("area") ?? ""),
    });

    if (!parsed.success) return;

    await prisma.stop.upsert({
        where: { code: parsed.data.code },
        update: {
            name: parsed.data.name,
            type: parsed.data.type as StopType,
            latitude: parsed.data.latitude,
            longitude: parsed.data.longitude,
            area: parsed.data.area || null,
            isActive: true,
        },
        create: {
            code: parsed.data.code,
            name: parsed.data.name,
            type: parsed.data.type as StopType,
            latitude: parsed.data.latitude,
            longitude: parsed.data.longitude,
            area: parsed.data.area || null,
            isActive: true,
        },
    });

    revalidatePath("/dashboard/stops");
}

export default async function StopsPage() {
    const stops = await prisma.stop.findMany({
        orderBy: { name: "asc" },
        include: {
            schedules: {
                include: { route: true },
                orderBy: { sequence: "asc" },
            },
        },
    });

    const stationCount = stops.filter((stop) => stop.type === "STATION").length;
    const busStopCount = stops.filter((stop) => stop.type !== "STATION").length;

    return (
        <div>
            <PageHeading
                label="Stops"
                title="Stops and stations"
                description="Admin-ready list of stop coordinates, service types, and connected routes for ETA and transfer planning."
            />

            <div className="grid gap-4 md:grid-cols-3">
                <MetricCard title="Total Stops" value={stops.length} description="Registered stop points" icon={MapPin} />
                <MetricCard title="Stations" value={stationCount} description="Rail or terminal facilities" icon={Waypoints} />
                <MetricCard title="Bus Points" value={busStopCount} description="Bus stops and terminals" icon={Route} />
            </div>

            <Card className="mt-6 rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                <CardContent className="p-5">
                    <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                        Add or update stop/station
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Prefer adding stops from Path Builder by clicking the map. Use this
                        manual form only for advanced coordinate fixes.
                    </p>
                    <details className="mt-5 rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                        <summary className="cursor-pointer text-sm font-medium">
                            Advanced: add stop with coordinates
                        </summary>
                    <form action={createStop} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                        <input name="code" required placeholder="Code" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                        <input name="name" required placeholder="Name" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                        <select name="type" required className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900">
                            <option value="BUS_STOP">BUS_STOP</option>
                            <option value="STATION">STATION</option>
                            <option value="TERMINAL">TERMINAL</option>
                        </select>
                        <input name="latitude" required type="number" step="0.000001" placeholder="Latitude" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                        <input name="longitude" required type="number" step="0.000001" placeholder="Longitude" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                        <input name="area" placeholder="Area" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                        <Button className="h-10 rounded-xl bg-slate-950 text-white shadow-none dark:bg-white dark:text-slate-950 xl:col-span-6">
                            Save stop
                        </Button>
                    </form>
                    </details>
                </CardContent>
            </Card>

            <Card className="mt-6 rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Stop</th>
                                    <th className="px-5 py-3 font-medium">Type</th>
                                    <th className="px-5 py-3 font-medium">Area</th>
                                    <th className="px-5 py-3 font-medium">Routes</th>
                                    <th className="px-5 py-3 font-medium">Coordinate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stops.map((stop) => (
                                    <tr
                                        key={stop.id}
                                        className="border-b border-slate-100 last:border-0 dark:border-white/5"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="font-medium text-slate-950 dark:text-white">
                                                {stop.name}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {stop.code}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge status={stop.type} />
                                        </td>
                                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                            {stop.area ?? "-"}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                            {stop.schedules.map((schedule) => schedule.route.code).join(", ") || "-"}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                                            {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
