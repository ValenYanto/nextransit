import Link from "next/link";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Bus, Gauge, MapPin, UsersRound } from "lucide-react";

import { prisma } from "@/lib/prisma";
import type { RouteType, VehicleStatus } from "@/lib/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { StatusBadge } from "@/components/shared/status-badge";

export const dynamic = "force-dynamic";

const vehicleSchema = z.object({
    code: z.string().trim().min(1).max(32),
    plateNumber: z.string().trim().optional(),
    type: z.enum(["BUS", "MRT", "LRT", "FEEDER"]),
    capacity: z.coerce.number().int().positive(),
    status: z.enum(["ACTIVE", "DELAYED", "CROWDED", "MAINTENANCE", "OFFLINE"]),
    direction: z.enum(["OUTBOUND", "INBOUND"]).default("OUTBOUND"),
    currentRouteId: z.string().optional(),
});

async function createVehicle(formData: FormData) {
    "use server";

    const parsed = vehicleSchema.safeParse({
        code: String(formData.get("code") ?? ""),
        plateNumber: String(formData.get("plateNumber") ?? ""),
        type: String(formData.get("type") ?? ""),
        capacity: formData.get("capacity"),
        status: String(formData.get("status") ?? ""),
        direction: String(formData.get("direction") ?? "OUTBOUND"),
        currentRouteId: String(formData.get("currentRouteId") ?? "") || undefined,
    });

    if (!parsed.success) return;

    const vehicle = await prisma.vehicle.upsert({
        where: { code: parsed.data.code },
        update: {
            plateNumber: parsed.data.plateNumber || null,
            type: parsed.data.type as RouteType,
            capacity: parsed.data.capacity,
            status: parsed.data.status as VehicleStatus,
            direction: parsed.data.direction,
            currentRouteId: parsed.data.currentRouteId || null,
        },
        create: {
            code: parsed.data.code,
            plateNumber: parsed.data.plateNumber || null,
            type: parsed.data.type as RouteType,
            capacity: parsed.data.capacity,
            status: parsed.data.status as VehicleStatus,
            direction: parsed.data.direction,
            currentRouteId: parsed.data.currentRouteId || null,
        },
    });

    if (parsed.data.currentRouteId) {
        const firstPathPoint = await prisma.routePathPoint.findFirst({
            where: { routeId: parsed.data.currentRouteId },
            orderBy: { sequence: "asc" },
        });

        if (firstPathPoint) {
            await prisma.vehiclePosition.create({
                data: {
                    vehicleId: vehicle.id,
                    latitude: firstPathPoint.latitude,
                    longitude: firstPathPoint.longitude,
                    speedKmh: parsed.data.type === "BUS" || parsed.data.type === "FEEDER" ? 18 : 44,
                },
            });
        }
    }

    await prisma.vehicleOccupancy.create({
        data: {
            vehicleId: vehicle.id,
            passengerCount: Math.min(Math.round(parsed.data.capacity * 0.35), parsed.data.capacity),
            capacity: parsed.data.capacity,
        },
    });

    revalidatePath("/dashboard/fleet");
}

export default async function FleetPage() {
    const [vehicles, routes] = await Promise.all([
        prisma.vehicle.findMany({
            orderBy: { code: "asc" },
            include: {
                currentRoute: true,
                positions: {
                    take: 1,
                    orderBy: { recordedAt: "desc" },
                },
                occupancies: {
                    take: 1,
                    orderBy: { recordedAt: "desc" },
                },
            },
        }),
        prisma.route.findMany({
            where: { isActive: true },
            orderBy: { code: "asc" },
        }),
    ]);

    const activeCount = vehicles.filter((vehicle) => vehicle.status === "ACTIVE").length;
    const delayedCount = vehicles.filter((vehicle) => vehicle.status === "DELAYED").length;
    const totalCapacity = vehicles.reduce((sum, vehicle) => sum + vehicle.capacity, 0);
    const averageSpeed =
        vehicles.length > 0
            ? Math.round(
                vehicles.reduce(
                    (sum, vehicle) => sum + (vehicle.positions[0]?.speedKmh ?? 0),
                    0,
                ) / vehicles.length,
            )
            : 0;

    return (
        <div>
            <PageHeading
                label="Fleet"
                title="Fleet monitoring"
                description="Pantau status armada, rute aktif, kapasitas, okupansi, dan posisi terakhir secara ringkas."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard title="Total Fleet" value={vehicles.length} description={`${activeCount} active fleet`} icon={Bus} />
                <MetricCard title="Delayed" value={delayedCount} description="Need operational attention" icon={Gauge} />
                <MetricCard title="Total Capacity" value={totalCapacity} description="Passenger capacity" icon={UsersRound} />
                <MetricCard title="Avg Speed" value={`${averageSpeed} km/h`} description="Latest recorded speed" icon={MapPin} />
            </div>

            <Card className="mt-6 rounded-2xl border-gray-100 bg-white shadow-none dark:border-white/[0.07] dark:bg-[#0d1f22]">
                <CardContent className="p-5">
                    <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                        Add or update vehicle
                    </h2>
                    <p className="mt-1 text-sm text-[#757780]">
                        Assign buses and trains to a route. Initial positions are pinned to
                        route geometry so live tracking stays on corridor path.
                    </p>
                    <details className="mt-5 rounded-2xl border border-gray-100 p-4 dark:border-white/[0.07]">
                        <summary className="cursor-pointer text-sm font-medium">
                            Add new vehicle
                        </summary>
                    <form action={createVehicle} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <input name="code" required placeholder="Vehicle code" className="h-11 rounded-xl border border-gray-200 bg-[#f9fafb] px-4 text-sm text-[#001011] outline-none placeholder:text-[#757780] focus:border-[#6CCFF6] focus:ring-2 focus:ring-[#6CCFF6]/20 dark:border-white/[0.08] dark:bg-[#001011] dark:text-[#FFFFFC]" />
                        <input name="plateNumber" placeholder="Plate number" className="h-11 rounded-xl border border-gray-200 bg-[#f9fafb] px-4 text-sm text-[#001011] outline-none placeholder:text-[#757780] focus:border-[#6CCFF6] focus:ring-2 focus:ring-[#6CCFF6]/20 dark:border-white/[0.08] dark:bg-[#001011] dark:text-[#FFFFFC]" />
                        <select name="type" required className="h-11 rounded-xl border border-gray-200 bg-[#f9fafb] px-4 text-sm text-[#001011] outline-none focus:border-[#6CCFF6] dark:border-white/[0.08] dark:bg-[#001011] dark:text-[#FFFFFC]">
                            <option value="BUS">BUS</option>
                            <option value="MRT">MRT</option>
                            <option value="LRT">LRT</option>
                            <option value="FEEDER">FEEDER</option>
                        </select>
                        <input name="capacity" required type="number" min="1" placeholder="Capacity" className="h-11 rounded-xl border border-gray-200 bg-[#f9fafb] px-4 text-sm text-[#001011] outline-none placeholder:text-[#757780] focus:border-[#6CCFF6] focus:ring-2 focus:ring-[#6CCFF6]/20 dark:border-white/[0.08] dark:bg-[#001011] dark:text-[#FFFFFC]" />
                        <select name="status" required className="h-11 rounded-xl border border-gray-200 bg-[#f9fafb] px-4 text-sm text-[#001011] outline-none focus:border-[#6CCFF6] dark:border-white/[0.08] dark:bg-[#001011] dark:text-[#FFFFFC]">
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="DELAYED">DELAYED</option>
                            <option value="CROWDED">CROWDED</option>
                            <option value="MAINTENANCE">MAINTENANCE</option>
                            <option value="OFFLINE">OFFLINE</option>
                        </select>
                        <select name="direction" required className="h-11 rounded-xl border border-gray-200 bg-[#f9fafb] px-4 text-sm text-[#001011] outline-none focus:border-[#6CCFF6] dark:border-white/[0.08] dark:bg-[#001011] dark:text-[#FFFFFC]">
                            <option value="OUTBOUND">Toward destination</option>
                            <option value="INBOUND">Toward origin</option>
                        </select>
                        <select name="currentRouteId" className="h-11 rounded-xl border border-gray-200 bg-[#f9fafb] px-4 text-sm text-[#001011] outline-none focus:border-[#6CCFF6] dark:border-white/[0.08] dark:bg-[#001011] dark:text-[#FFFFFC] xl:col-span-2">
                            <option value="">Unassigned</option>
                            {routes.map((route) => (
                                <option key={route.id} value={route.id}>
                                    {route.code} · {route.name}
                                </option>
                            ))}
                        </select>
                        <Button className="h-11 rounded-xl bg-[#6CCFF6] font-semibold text-[#001011] shadow-none">
                            Save vehicle
                        </Button>
                    </form>
                    </details>
                </CardContent>
            </Card>

            <Card className="mt-6 rounded-2xl border-gray-100 bg-white shadow-none dark:border-white/[0.07] dark:bg-[#0d1f22]">
                <CardContent className="p-0">
                    <div className="border-b border-gray-100 p-5 dark:border-white/[0.07]">
                        <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                            Fleet list
                        </h2>
                        <p className="mt-1 text-sm text-[#757780]">
                            Latest operational status, occupancy, and live route links.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-gray-100 bg-[#f9fafb] text-xs uppercase tracking-widest text-[#757780] dark:border-white/[0.07] dark:bg-white/[0.03]">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Fleet</th>
                                    <th className="px-5 py-3 font-medium">Type</th>
                                    <th className="px-5 py-3 font-medium">Route</th>
                                    <th className="px-5 py-3 font-medium">Direction</th>
                                    <th className="px-5 py-3 font-medium">Capacity</th>
                                    <th className="px-5 py-3 font-medium">Occupancy</th>
                                    <th className="px-5 py-3 font-medium">Speed</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium">Last Position</th>
                                </tr>
                            </thead>

                            <tbody>
                                {vehicles.map((vehicle) => {
                                    const latestPosition = vehicle.positions[0];
                                    const latestOccupancy = vehicle.occupancies[0];

                                    return (
                                        <tr key={vehicle.id} className="border-b border-slate-100 last:border-0 dark:border-white/5">
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-[#001011] dark:text-[#FFFFFC]">{vehicle.code}</p>
                                                <p className="text-xs text-[#757780]">{vehicle.plateNumber ?? "No plate"}</p>
                                            </td>
                                            <td className="px-5 py-4"><StatusBadge status={vehicle.type} /></td>
                                            <td className="px-5 py-4 text-sm text-[#001011] dark:text-[#FFFFFC]">{vehicle.currentRoute?.name ?? <span className="text-[#757780]">Unassigned</span>}</td>
                                            <td className="px-5 py-4 text-sm text-[#757780]">
                                                {vehicle.currentRoute
                                                    ? vehicle.direction === "INBOUND"
                                                        ? `${vehicle.currentRoute.destination} → ${vehicle.currentRoute.origin}`
                                                        : `${vehicle.currentRoute.origin} → ${vehicle.currentRoute.destination}`
                                                    : "-"}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-[#757780]">{vehicle.capacity}</td>
                                            <td className="px-5 py-4">
                                                {latestOccupancy ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-[#757780]">{latestOccupancy.passengerCount}/{latestOccupancy.capacity}</span>
                                                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                                                            <div
                                                                className={`h-full rounded-full ${
                                                                    latestOccupancy.passengerCount / latestOccupancy.capacity > 0.85
                                                                        ? "bg-[#EF4444]"
                                                                        : latestOccupancy.passengerCount / latestOccupancy.capacity > 0.6
                                                                            ? "bg-[#F59E0B]"
                                                                            : "bg-[#10B981]"
                                                                }`}
                                                                style={{
                                                                    width: `${Math.min(100, (latestOccupancy.passengerCount / latestOccupancy.capacity) * 100)}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : <span className="text-[#757780]">-</span>}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-[#757780]">
                                                {latestPosition ? `${latestPosition.speedKmh} km/h` : "-"}
                                            </td>
                                            <td className="px-5 py-4"><StatusBadge status={vehicle.status} /></td>
                                            <td className="px-5 py-4 font-mono text-xs text-[#757780]">
                                                {latestPosition
                                                    ? `${latestPosition.latitude.toFixed(4)}, ${latestPosition.longitude.toFixed(4)}`
                                                    : "-"}
                                                {vehicle.currentRouteId ? (
                                                    <Link href={`/passenger/routes/${vehicle.currentRouteId}`} className="ml-3 text-xs font-medium text-[#6CCFF6]">
                                                        View live
                                                    </Link>
                                                ) : null}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
