import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PassengerHeader } from "@/components/layout/passenger-header";
import { PublicTransitSelector } from "@/components/landing/public-transit-selector";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [session, modes] = await Promise.all([
    getServerSession(authOptions),
    prisma.transportMode.findMany({
      where: {
        isActive: true,
        routes: { some: { isActive: true } },
      },
      orderBy: { name: "asc" },
      include: {
        routes: {
          where: { isActive: true },
          include: { _count: { select: { vehicles: true } } },
        },
        _count: {
          select: { routes: { where: { isActive: true } } },
        },
      },
    }),
  ]);

  const modeList = modes.map((mode) => ({
    id: mode.id,
    name: mode.name,
    slug: mode.slug,
    description: mode.description,
    icon: mode.icon,
    routeCount: mode._count.routes,
    liveUnitCount: mode.routes.reduce((sum, route) => sum + route._count.vehicles, 0),
  }));

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FFFFFC] text-[#001011] dark:bg-[#001011] dark:text-[#FFFFFC]">
      <PassengerHeader transparent />

      <section className="mx-auto max-w-[640px] px-4 pb-8 pt-16 text-center sm:px-8 sm:pb-12 sm:pt-24">
        <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#001011] dark:text-[#FFFFFC]">
          Where are you going today?
        </h1>
        <p className="mt-3 text-[1.1rem] leading-7 text-[#757780]">
          Pick your transport, find your route, track it live.
        </p>
      </section>

      <div className="px-4 pb-8 sm:px-8">
        <PublicTransitSelector modes={modeList} isAuthenticated={Boolean(session)} />
      </div>

      <section className="mx-auto px-4 pb-12 text-center text-sm text-[#757780] sm:px-8">
        Are you a transport operator?
        <Link
          href={session ? "/dashboard" : "/login?callbackUrl=/dashboard"}
          className="ml-1 font-semibold text-[#6CCFF6] hover:underline"
        >
          Sign in to manage routes →
        </Link>
      </section>
    </main>
  );
}
