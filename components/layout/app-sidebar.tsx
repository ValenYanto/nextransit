import Link from "next/link";
import {
    BarChart3,
    Bus,
    Gauge,
    Map,
    Route,
    Settings,
    Sparkles,
} from "lucide-react";

import { Logo } from "@/components/shared/logo";

const navItems = [
    { title: "Overview", href: "/dashboard", icon: Gauge },
    { title: "Live Map", href: "/dashboard/live-map", icon: Map },
    { title: "Fleet", href: "/dashboard/fleet", icon: Bus },
    { title: "Routes", href: "/dashboard/routes", icon: Route },
    { title: "Predictions", href: "/dashboard/predictions", icon: BarChart3 },
    { title: "Simulator", href: "/dashboard/simulator", icon: Sparkles },
];

export function AppSidebar() {
    return (
        <aside className="hidden min-h-screen w-72 border-r border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950 lg:block">
            <Logo href="/dashboard" />

            <nav className="mt-8 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                    </Link>
                ))}
            </nav>

            <div className="mt-8 rounded-3xl bg-cyan-500 p-5 text-white">
                <Settings className="h-6 w-6" />
                <p className="mt-3 font-bold">Operator Mode</p>
                <p className="mt-1 text-sm text-cyan-50">
                    Monitor fleet, stops, predictions, and rush hour scenarios.
                </p>
            </div>
        </aside>
    );
}