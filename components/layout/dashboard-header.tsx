import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LogoutButton } from "@/components/auth/logout-button";

export async function DashboardHeader() {
    const session = await getServerSession(authOptions);

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                        NexTransit
                    </p>
                    <h1 className="mt-1 font-[var(--font-jakarta)] text-lg font-semibold text-slate-950 dark:text-white">
                        Transit Control Center
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="hidden rounded-xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-transparent md:flex"
                    >
                        <Search className="mr-2 h-4 w-4" />
                        Search
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-transparent"
                    >
                        <Bell className="h-4 w-4" />
                    </Button>

                    <ThemeToggle />

                    <div className="mx-2 hidden h-8 w-px bg-slate-200 dark:bg-white/10 md:block" />

                    <div className="hidden text-right md:block">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {session?.user?.name ?? "Operator"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {session?.user?.role ?? "OPERATOR"}
                        </p>
                    </div>

                    <LogoutButton />
                </div>
            </div>
        </header>
    );
}