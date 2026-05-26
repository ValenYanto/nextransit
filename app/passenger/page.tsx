import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { RoutePlanner } from "@/components/passenger/route-planner";

export default async function PassengerPage() {
    const stops = await prisma.stop.findMany({
        where: {
            isActive: true,
        },
        orderBy: {
            name: "asc",
        },
        select: {
            id: true,
            name: true,
            code: true,
        },
    });

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                <Logo />

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button
                        asChild
                        variant="outline"
                        className="rounded-xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-transparent"
                    >
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Home
                        </Link>
                    </Button>
                </div>
            </header>

            <section className="mx-auto max-w-6xl px-6 py-10">
                <div className="max-w-3xl">
                    <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">
                        Passenger App
                    </p>
                    <h1 className="mt-2 font-[var(--font-jakarta)] text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
                        Plan your intermodal trip.
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Pilih origin dan destination untuk mendapatkan rekomendasi perjalanan
                        berdasarkan ETA, traffic, crowd density, dan koneksi feeder–MRT/LRT.
                    </p>
                </div>

                <div className="mt-8">
                    <RoutePlanner stops={stops} />
                </div>
            </section>
        </main>
    );
}