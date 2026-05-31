import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MapPin, Pencil, Route, Trash2, Waypoints } from "lucide-react";
import type { ComponentType } from "react";

import { prisma } from "@/lib/prisma";
import type { StopType } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";

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
        <div className="space-y-6">
            <div>
                <p className="text-sm text-[#757780]">Stops</p>
                <h1 className="mt-1 text-3xl font-semibold">Stops and stations</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#757780]">
                    Manage readable stop names, service types, route coverage, and map coordinates.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <StopStat title="Total Stops" value={stops.length} icon={MapPin} />
                <StopStat title="Stations" value={stationCount} icon={Waypoints} />
                <StopStat title="Bus Stops & Terminals" value={busStopCount} icon={Route} />
            </div>

            <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 dark:border-[#1a2f32] dark:bg-[#0d1f22]">
                    <h2 className="text-lg font-semibold">
                        Add or update stop/station
                    </h2>
                    <p className="mt-1 text-sm text-[#757780]">
                        Prefer adding stops from Path Builder by clicking the map. Use this
                        manual form only for advanced coordinate fixes.
                    </p>
                    <details className="mt-5 rounded-2xl border border-[#e5e7eb] bg-[#FFFFFC] p-4 dark:border-[#1a2f32] dark:bg-[#001011]">
                        <summary className="cursor-pointer text-sm font-medium">
                            Advanced: add stop with coordinates
                        </summary>
                    <form action={createStop} className="mt-5 grid gap-3 md:grid-cols-2">
                        <input name="name" required placeholder="Stop name" className="h-11 rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm dark:border-[#1a2f32] dark:bg-[#0d1f22]" />
                        <input name="code" required placeholder="Stop code" className="h-11 rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm dark:border-[#1a2f32] dark:bg-[#0d1f22]" />
                        <select name="type" required className="h-11 rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm dark:border-[#1a2f32] dark:bg-[#0d1f22]">
                            <option value="BUS_STOP">BUS_STOP</option>
                            <option value="STATION">STATION</option>
                            <option value="TERMINAL">TERMINAL</option>
                        </select>
                        <input name="area" placeholder="Area" className="h-11 rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm dark:border-[#1a2f32] dark:bg-[#0d1f22]" />
                        <input name="latitude" required type="number" step="0.000001" placeholder="Latitude" className="h-11 rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm dark:border-[#1a2f32] dark:bg-[#0d1f22]" />
                        <input name="longitude" required type="number" step="0.000001" placeholder="Longitude" className="h-11 rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm dark:border-[#1a2f32] dark:bg-[#0d1f22]" />
                        <Button className="h-11 rounded-xl bg-[#6CCFF6] text-[#001011] shadow-none md:col-span-2">
                            Save stop
                        </Button>
                    </form>
                    </details>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white dark:border-[#1a2f32] dark:bg-[#0d1f22]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-[#e5e7eb] text-xs uppercase tracking-wider text-[#757780] dark:border-[#1a2f32]">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium">Code</th>
                                    <th className="px-4 py-3 font-medium">Type</th>
                                    <th className="hidden px-4 py-3 font-medium md:table-cell">Area</th>
                                    <th className="px-4 py-3 font-medium">Routes</th>
                                    <th className="hidden px-4 py-3 font-medium lg:table-cell">Coordinates</th>
                                    <th className="px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stops.map((stop) => {
                                    const routeCodes = Array.from(new Set(stop.schedules.map((schedule) => schedule.route.code)));
                                    const primaryName = getReadableStopName(stop.name, stop.code);

                                    return (
                                    <tr
                                        key={stop.id}
                                        className="border-b border-[#f3f4f6] hover:bg-[#FFFFFC] last:border-0 dark:border-[#1a2f32] dark:hover:bg-[#0a1a1c]"
                                    >
                                        <td className="px-4 py-3">
                                            <p className={`font-medium ${primaryName.isFallback ? "italic text-[#757780]" : "text-[#001011] dark:text-[#FFFFFC]"}`}>
                                                {primaryName.value}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-md bg-[#757780]/10 px-2 py-1 font-mono text-xs text-[#757780]">
                                                {stop.code}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StopTypeBadge type={stop.type} />
                                        </td>
                                        <td className="hidden px-4 py-3 text-[#757780] md:table-cell">
                                            {stop.area ?? "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {routeCodes.length > 0 ? routeCodes.map((code) => (
                                                    <span key={code} className="rounded-md bg-[#6CCFF6]/10 px-2 py-1 text-xs font-medium text-[#6CCFF6]">
                                                        {code}
                                                    </span>
                                                )) : <span className="text-[#757780]">-</span>}
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-3 font-mono text-xs text-[#757780] lg:table-cell">
                                            {stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <button type="button" disabled title="Edit coming soon" className="rounded-lg p-2 text-[#757780] opacity-60">
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button type="button" disabled title="Delete coming soon" className="rounded-lg p-2 text-[#757780] opacity-60">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                                })}
                            </tbody>
                        </table>
                    </div>
            </section>
        </div>
    );
}

function StopStat({
    title,
    value,
    icon: Icon,
}: {
    title: string;
    value: number;
    icon: ComponentType<{ className?: string }>;
}) {
    return (
        <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5 dark:border-[#1a2f32] dark:bg-[#0d1f22]">
            <Icon className="h-5 w-5 text-[#6CCFF6]" />
            <p className="mt-5 text-[32px] font-bold text-[#001011] dark:text-[#FFFFFC]">{value}</p>
            <p className="mt-1 text-[13px] text-[#757780]">{title}</p>
        </article>
    );
}

function StopTypeBadge({ type }: { type: string }) {
    const className =
        type === "STATION"
            ? "bg-[#6CCFF6]/15 text-[#6CCFF6]"
            : type === "TERMINAL"
                ? "bg-[#10B981]/15 text-[#001011] dark:text-[#10B981]"
                : "bg-[#757780]/15 text-[#757780]";

    return (
        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${className}`}>
            {type}
        </span>
    );
}

function getReadableStopName(name: string, code: string) {
    const trimmed = name.trim();
    const looksRaw = trimmed.length <= 3 || /^\d+$/.test(trimmed);
    if (!trimmed || looksRaw) return { value: code || "Unnamed stop", isFallback: true };
    return { value: trimmed, isFallback: false };
}
