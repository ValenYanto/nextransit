import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { PassengerLiveClient } from "@/components/passenger/passenger-live-client";

export default function PassengerPage() {
    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
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

            <section className="mx-auto max-w-7xl px-6 py-8">
                <div className="mb-8 max-w-3xl">
                    <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">
                        NexTransit Live
                    </p>
                    <h1 className="mt-2 font-[var(--font-jakarta)] text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
                        Track nearby buses and intermodal connections.
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        Lihat armada terdekat, estimasi kedatangan, jumlah penumpang di
                        dalam kendaraan, tingkat kepadatan, serta rute yang paling
                        direkomendasikan.
                    </p>
                </div>

                <PassengerLiveClient />
            </section>
        </main>
    );
}