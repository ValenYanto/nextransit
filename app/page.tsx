import Link from "next/link";
import { ArrowRight, Bus, Clock3, MapPinned, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Logo } from "@/components/shared/logo";

const features = [
  {
    title: "ETA Prediction",
    description:
      "Prediksi kedatangan bus dan feeder berdasarkan posisi armada, lalu lintas, dan data historis.",
    icon: Clock3,
  },
  {
    title: "Intermodal Connection",
    description:
      "Rekomendasi koneksi bus, MRT, dan LRT dengan waktu tunggu paling singkat.",
    icon: MapPinned,
  },
  {
    title: "Fleet Monitoring",
    description:
      "Pantau status armada, keterlambatan, dan performa operasional secara real-time.",
    icon: Bus,
  },
  {
    title: "Crowd Prediction",
    description:
      "Prediksi kepadatan halte dan stasiun untuk membantu distribusi armada.",
    icon: UsersRound,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <section className="relative border-b border-slate-200 bg-gradient-to-br from-cyan-50 via-white to-blue-50 dark:border-white/10 dark:from-slate-950 dark:via-slate-950 dark:to-cyan-950/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_30%)]" />

        <header className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Logo />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </header>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-sm font-medium text-cyan-700 shadow-sm dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200">
              AI-powered ETA & Intermodal Optimization
            </div>

            <h1 className="max-w-4xl text-5xl font-black tracking-tight text-slate-950 dark:text-white md:text-7xl">
              Smarter public transit with{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                NexTransit AI
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              NexTransit membantu memprediksi ETA bus/feeder, mengoptimalkan
              koneksi MRT/LRT, memantau kepadatan halte, dan memberi rekomendasi
              operasional untuk mengurangi waktu tunggu penumpang.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-2xl">
                <Link href="/passenger">
                  Coba Passenger App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-2xl">
                <Link href="/dashboard">Lihat Operator Dashboard</Link>
              </Button>
            </div>
          </div>

          <Card className="rounded-[2rem] border-cyan-100 bg-white/80 shadow-2xl shadow-cyan-500/10 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <CardContent className="p-6">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-900">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Recommended Trip
                    </p>
                    <h3 className="text-xl font-bold">Feeder → MRT → LRT</h3>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                    Optimized
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    ["Feeder B12", "Arrives in 6 min", "On time"],
                    ["MRT Connection", "Transfer wait 4 min", "Best option"],
                    ["LRT Segment", "Platform density medium", "Stable"],
                  ].map(([title, meta, status]) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{title}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {meta}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-300">
                          {status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl bg-cyan-500 p-5 text-white">
                  <p className="text-sm opacity-90">Total estimated journey</p>
                  <p className="text-4xl font-black">42 min</p>
                  <p className="mt-1 text-sm opacity-90">
                    18% faster than non-optimized route
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <p className="font-semibold text-cyan-600 dark:text-cyan-300">
            Core Features
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">
            Dibangun untuk penumpang dan operator
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="rounded-3xl border-slate-200 dark:border-white/10 dark:bg-white/5"
            >
              <CardContent className="p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}