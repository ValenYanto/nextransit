import Link from "next/link";
import {
    ArrowLeft,
    Bus,
    Clock3,
    MapPin,
    Route,
    Train,
    UsersRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { StatusBadge } from "@/components/shared/status-badge";
import {
    calculateEtaMinutes,
    formatEta,
    getEtaConfidence,
} from "@/lib/prediction/eta";
import { getDensityDescription } from "@/lib/prediction/crowd";

export default async function PassengerPage() {
    const [routes, stops, vehicles, latestPrediction] = await Promise.all([
        prisma.route.findMany({
            orderBy: {
                code: "asc",
            },
            include: {
                schedules: {
                    include: {
                        stop: true,
                    },
                    orderBy: {
                        sequence: "asc",
                    },
                },
            },
        }),
        prisma.stop.findMany({
            orderBy: {
                name: "asc",
            },
        }),
        prisma.vehicle.findMany({
            include: {
                currentRoute: true,
                positions: {
                    take: 1,
                    orderBy: {
                        recordedAt: "desc",
                    },
                },
            },
        }),
        prisma.crowdPrediction.findFirst({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                stop: true,
            },
        }),
    ]);

    const feederRoute =
        routes.find((route) => route.type === "FEEDER") ?? routes[0];

    const mrtRoute = routes.find((route) => route.type === "MRT");

    const feederVehicle =
        vehicles.find((vehicle) => vehicle.type === "FEEDER") ?? vehicles[0];

    const latestPosition = feederVehicle?.positions[0];
    const speed = latestPosition?.speedKmh ?? 22;

    const crowdLevel = latestPrediction?.densityLevel ?? "MEDIUM";
    const trafficLevel = speed >= 30 ? "LOW" : speed >= 15 ? "MEDIUM" : "HIGH";

    const feederEta = calculateEtaMinutes({
        distanceKm: feederRoute?.distanceKm ?? 8,
        averageSpeedKmh: speed,
        trafficLevel,
        crowdLevel,
    });

    const transferWait = crowdLevel === "CRITICAL" ? 9 : crowdLevel === "HIGH" ? 7 : 4;
    const mrtEta = mrtRoute
        ? calculateEtaMinutes({
            distanceKm: mrtRoute.distanceKm,
            averageSpeedKmh: 38,
            trafficLevel: "LOW",
            crowdLevel,
        })
        : 18;

    const totalTrip = feederEta + transferWait + mrtEta;
    const confidence = getEtaConfidence(trafficLevel, crowdLevel);

    const journeySteps = [
        {
            title: feederRoute?.name ?? "Feeder Service",
            description: `${feederVehicle?.code ?? "Feeder"} arrives in ${formatEta(
                feederEta,
            )}`,
            icon: Bus,
            meta: `${speed} km/h · ${trafficLevel} traffic`,
        },
        {
            title: "Intermodal Transfer",
            description: `Estimated transfer wait ${transferWait} min`,
            icon: Route,
            meta: latestPrediction
                ? `${latestPrediction.stop.name} · ${latestPrediction.densityLevel} density`
                : "Transfer hub · medium density",
        },
        {
            title: mrtRoute?.name ?? "MRT/LRT Connection",
            description: `Estimated segment time ${formatEta(mrtEta)}`,
            icon: Train,
            meta: "Optimized connection",
        },
    ];

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
                        Find a calmer, faster intermodal trip.
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        NexTransit membantu memilih koneksi feeder, MRT, dan LRT berdasarkan
                        prediksi ETA, kondisi lalu lintas, serta kepadatan halte atau stasiun.
                    </p>
                </div>

                <div className="mt-8 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                    <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                        <CardContent className="p-5">
                            <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                                Trip request
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Static MVP scenario generated from seeded transit data.
                            </p>

                            <div className="mt-5 space-y-3">
                                <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                                    <div className="flex items-center gap-3">
                                        <MapPin className="h-4 w-4 text-slate-400" />
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                From
                                            </p>
                                            <p className="font-medium">
                                                {stops.find((stop) => stop.code === "KMP")?.name ??
                                                    "Campus Feeder Stop"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
                                    <div className="flex items-center gap-3">
                                        <MapPin className="h-4 w-4 text-slate-400" />
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                To
                                            </p>
                                            <p className="font-medium">
                                                {stops.find((stop) => stop.code === "DKA")?.name ??
                                                    "Dukuh Atas Interchange"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        AI Confidence
                                    </p>
                                    <p className="mt-1 font-[var(--font-jakarta)] text-2xl font-semibold">
                                        {Math.round(confidence * 100)}%
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                                        Recommended journey
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Feeder connection optimized for transfer time and crowd level.
                                    </p>
                                </div>

                                <StatusBadge status="Optimized" />
                            </div>

                            <div className="mt-6 space-y-3">
                                {journeySteps.map((step, index) => (
                                    <div
                                        key={step.title}
                                        className="flex gap-4 rounded-xl border border-slate-200 p-4 dark:border-white/10"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                                            <step.icon className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="font-medium">{step.title}</p>
                                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                        {step.description}
                                                    </p>
                                                </div>

                                                <p className="text-xs text-slate-400">0{index + 1}</p>
                                            </div>

                                            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                                {step.meta}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 grid gap-3 md:grid-cols-3">
                                <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                                    <Clock3 className="h-4 w-4 text-slate-400" />
                                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                        Total Trip
                                    </p>
                                    <p className="mt-1 font-[var(--font-jakarta)] text-2xl font-semibold">
                                        {formatEta(totalTrip)}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                                    <UsersRound className="h-4 w-4 text-slate-400" />
                                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                        Crowd Level
                                    </p>
                                    <div className="mt-2">
                                        <StatusBadge status={crowdLevel} />
                                    </div>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                                    <Bus className="h-4 w-4 text-slate-400" />
                                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                        Feeder ETA
                                    </p>
                                    <p className="mt-1 font-[var(--font-jakarta)] text-2xl font-semibold">
                                        {formatEta(feederEta)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-white/10">
                                <p className="text-sm font-medium">
                                    Crowd context
                                </p>
                                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    {getDensityDescription(crowdLevel)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </main>
    );
}