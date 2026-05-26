import { AlertTriangle, Bus, Clock3, UsersRound } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const stats = [
    {
        title: "Active Fleet",
        value: "42",
        desc: "+6 from last hour",
        icon: Bus,
    },
    {
        title: "Avg ETA Accuracy",
        value: "91%",
        desc: "Prediction confidence",
        icon: Clock3,
    },
    {
        title: "Crowded Stops",
        value: "8",
        desc: "Need monitoring",
        icon: UsersRound,
    },
    {
        title: "Delayed Routes",
        value: "5",
        desc: "Require action",
        icon: AlertTriangle,
    },
];

export default function DashboardPage() {
    return (
        <div>
            <div className="mb-6">
                <p className="font-semibold text-cyan-600 dark:text-cyan-300">
                    Overview
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-tight">
                    Real-time transit intelligence
                </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                    <Card
                        key={stat.title}
                        className="rounded-3xl dark:border-white/10 dark:bg-white/5"
                    >
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {stat.title}
                                    </p>
                                    <p className="mt-2 text-4xl font-black">{stat.value}</p>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {stat.desc}
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300">
                                    <stat.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <Card className="rounded-3xl dark:border-white/10 dark:bg-white/5">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-bold">AI Recommendations</h3>
                        <div className="mt-5 space-y-3">
                            {[
                                "Redirect 2 feeder buses to Fatmawati Station in the next 20 minutes.",
                                "Increase frequency on Route B12 during 17:00–18:30 rush hour.",
                                "Platform density at Dukuh Atas is predicted to reach HIGH level.",
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-white/10 dark:bg-slate-950"
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl dark:border-white/10 dark:bg-white/5">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-bold">Today Summary</h3>
                        <div className="mt-5 space-y-4">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Total passengers simulated
                                </p>
                                <p className="text-3xl font-black">12,480</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Average waiting time
                                </p>
                                <p className="text-3xl font-black">7.2 min</p>
                            </div>
                            <div className="rounded-2xl bg-emerald-100 p-4 text-sm font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                                System estimates 18% waiting time reduction after optimization.
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}