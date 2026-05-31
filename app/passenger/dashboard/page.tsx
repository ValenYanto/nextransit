import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/auth/logout-button";
import { JourneyPlanner } from "@/components/passenger/journey-planner";
import { PassengerDashboardClient } from "@/components/passenger/passenger-dashboard-client";
import { PassengerHeader } from "@/components/layout/passenger-header";

export const dynamic = "force-dynamic";

export default async function PassengerDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const [modes, routes, stops] = await Promise.all([
    prisma.transportMode.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { routes: { where: { isActive: true } } } },
      },
    }),
    prisma.route.findMany({
      where: { isActive: true, modeId: { not: null } },
      orderBy: [{ type: "asc" }, { code: "asc" }],
      include: {
        mode: true,
        _count: { select: { vehicles: true, schedules: true } },
      },
    }),
    prisma.stop.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const liveUnitsByModeId = routes.reduce<Record<string, number>>((acc, route) => {
    if (!route.modeId) return acc;
    acc[route.modeId] = (acc[route.modeId] ?? 0) + route._count.vehicles;
    return acc;
  }, {});

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FFFFFC] text-[#001011] dark:bg-[#001011] dark:text-[#FFFFFC]">
      <PassengerHeader />

      <section className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-[#757780]">NexTransit Passenger</p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight text-[#001011] dark:text-[#FFFFFC] sm:text-3xl">
              {greeting}, {session.user?.name ?? "Passenger"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#757780]">
              Plan your journey, choose a transport mode, and track a live route before you ride.
            </p>
          </div>
          <LogoutButton />
        </div>

        <JourneyPlanner
          stops={stops.map((stop) => ({
            id: stop.id,
            code: stop.code,
            name: stop.name,
            type: stop.type,
            latitude: stop.latitude,
            longitude: stop.longitude,
            area: stop.area,
          }))}
        />

        <PassengerDashboardClient
          modes={modes.map((mode) => ({
            id: mode.id,
            name: mode.name,
            slug: mode.slug,
            description: mode.description,
            color: mode.color,
            icon: mode.icon,
            routeCount: mode._count.routes,
            liveUnitCount: liveUnitsByModeId[mode.id] ?? 0,
          }))}
          routes={routes.map((route) => ({
            id: route.id,
            code: route.code,
            name: route.name,
            type: route.type,
            origin: route.origin,
            destination: route.destination,
            distanceKm: route.distanceKm,
            modeId: route.modeId,
            modeName: route.mode?.name ?? null,
            vehicleCount: route._count.vehicles,
            stopCount: route._count.schedules,
          }))}
        />
      </section>
    </main>
  );
}
