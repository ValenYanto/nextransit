import Link from "next/link";
import { Bus, MapPin, Route, UsersRound } from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [activeRoutes, liveVehicles, totalStops, latestVehicles] = await Promise.all([
    prisma.route.count({ where: { isActive: true } }),
    prisma.vehicle.count({ where: { status: { not: "OFFLINE" } } }),
    prisma.stop.count({ where: { isActive: true } }),
    prisma.vehicle.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        currentRoute: true,
        occupancies: { take: 1, orderBy: { recordedAt: "desc" } },
      },
    }),
  ]);

  const stats = [
    { label: "Active Routes", value: activeRoutes, icon: Route, trend: "Live network" },
    { label: "Live Vehicles", value: liveVehicles, icon: Bus, trend: "Realtime demo" },
    { label: "Total Stops", value: totalStops, icon: MapPin, trend: "Synced" },
    { label: "Active Users", value: "Demo", icon: UsersRound, trend: "Passenger app" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-[#757780]">Operator Dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold">Overview</h1>
        </div>
        <p className="text-sm text-[#757780]">
          {new Intl.DateTimeFormat("id-ID", { dateStyle: "full" }).format(new Date())}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="relative rounded-2xl border border-[#e5e7eb] bg-white p-6 dark:border-[#1a2f32] dark:bg-[#0d1f22]"
          >
            <span className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#6CCFF6]/10">
              <stat.icon className="h-[18px] w-[18px] text-[#6CCFF6]" />
            </span>
            <p className="text-4xl font-bold text-[#001011] dark:text-[#FFFFFC]">{stat.value}</p>
            <p className="mt-1 text-[13px] text-[#757780]">{stat.label}</p>
            <span className="mt-4 inline-flex rounded-full bg-[#10B981]/15 px-3 py-1 text-xs font-semibold text-[#10B981]">
              {stat.trend}
            </span>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/[0.07] dark:bg-[#0a1a1c] sm:flex-row">
        <Link
          href="/dashboard/simulator"
          className="flex min-h-11 items-center justify-center rounded-xl bg-[#6CCFF6] px-5 font-semibold text-[#001011]"
        >
          Run Simulator
        </Link>
        <Link
          href="/dashboard/live-map"
          className="flex min-h-11 items-center justify-center rounded-xl border border-[#6CCFF6] px-5 font-semibold text-[#6CCFF6]"
        >
          View Live Map
        </Link>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/[0.07] dark:bg-[#0a1a1c]">
        <h2 className="text-lg font-semibold">Recent activity</h2>
        <div className="mt-4 space-y-3">
          {latestVehicles.map((vehicle) => {
            const occupancy = vehicle.occupancies[0];
            return (
              <div
                key={vehicle.id}
                className="flex flex-col gap-2 rounded-xl bg-[#757780]/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{vehicle.code}</p>
                  <p className="text-sm text-[#757780]">
                    {vehicle.currentRoute?.code ?? "No route"} · {vehicle.status}
                  </p>
                </div>
                <p className="text-sm font-semibold text-[#6CCFF6]">
                  {occupancy ? `${occupancy.passengerCount}/${occupancy.capacity} passengers` : "No passengers"}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
