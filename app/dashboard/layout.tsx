import Link from "next/link";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

const mobileNavItems = [
    ["Overview", "/dashboard"],
    ["Live Map", "/dashboard/live-map"],
    ["Modes", "/dashboard/modes"],
    ["Routes", "/dashboard/routes"],
    ["Stops", "/dashboard/stops"],
    ["Fleet", "/dashboard/fleet"],
    ["Schedules", "/dashboard/schedules"],
    ["Path Builder", "/dashboard/path-builder"],
    ["Interchanges", "/dashboard/interchanges"],
    ["Predictions", "/dashboard/predictions"],
    ["Simulator", "/dashboard/simulator"],
    ["Case Alignment", "/dashboard/case-alignment"],
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            <AppSidebar />

            <div className="flex min-w-0 flex-1 flex-col">
                <DashboardHeader />
                <nav className="border-b border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950 lg:hidden">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {mobileNavItems.map(([title, href]) => (
                            <Link
                                key={href}
                                href={href}
                                className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:text-slate-300"
                            >
                                {title}
                            </Link>
                        ))}
                    </div>
                </nav>
                <main className="flex-1 px-4 py-5 sm:px-6">{children}</main>
            </div>
        </div>
    );
}
