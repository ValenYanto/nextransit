import Link from "next/link";
import {
    BarChart3,
    Bus,
    Gauge,
    Map,
    Route,
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
        <aside className="hidden min-h-screen w-72 border-r border-slate-200 bg-white px-5 py-6 dark:border-white/10 dark:bg-slate-950 lg:block">
            <Logo href="/dashboard" />

            <nav className="mt-10 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                    </Link>
                ))}
            </nav>

            <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Operator Workspace
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Monitor fleet, ETA prediction, stop density, and route performance.
                </p>
            </div>
        </aside>
    );
}