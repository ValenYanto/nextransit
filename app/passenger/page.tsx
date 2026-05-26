import Link from "next/link";
import { ArrowLeft, Bus, MapPin, Navigation } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function PassengerPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="font-semibold text-cyan-600 dark:text-cyan-300">
            Passenger App
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Find your fastest intermodal trip
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
            Simulasi awal untuk rekomendasi perjalanan feeder, MRT, dan LRT
            dengan prediksi ETA dan waktu tunggu.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="rounded-3xl dark:border-white/10 dark:bg-white/5">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold">Trip Planner</h2>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    From
                  </p>
                  <p className="mt-1 font-semibold">Kampus / Residential Area</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    To
                  </p>
                  <p className="mt-1 font-semibold">Office / City Center</p>
                </div>
                <Button className="w-full rounded-2xl">
                  <Navigation className="mr-2 h-4 w-4" />
                  Generate Recommendation
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl dark:border-white/10 dark:bg-white/5">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold">Recommended Route</h2>

              <div className="mt-6 space-y-4">
                {[
                  {
                    icon: Bus,
                    title: "Feeder B12",
                    desc: "Arrives in 6 minutes · medium crowd",
                  },
                  {
                    icon: MapPin,
                    title: "MRT Transfer",
                    desc: "4 minutes waiting time · on-time connection",
                  },
                  {
                    icon: Bus,
                    title: "Final Feeder",
                    desc: "Arrives in 5 minutes · low crowd",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold">{item.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 p-6 text-white">
                <p className="text-sm opacity-90">Estimated total trip</p>
                <p className="mt-1 text-5xl font-black">42 min</p>
                <p className="mt-2 text-sm opacity-90">
                  Optimized route reduces waiting time by 18%.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}