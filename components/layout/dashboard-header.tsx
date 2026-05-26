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
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        NexTransit Operator Dashboard
                    </p>
                    <h1 className="font-[var(--font-jakarta)] text-xl font-bold">
                        Transit Control Center
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="hidden rounded-2xl md:flex">
                        <Search className="mr-2 h-4 w-4" />
                        Search
                    </Button>

                    <Button variant="outline" size="icon">
                        <Bell className="h-4 w-4" />
                    </Button>

                    <ThemeToggle />

                    <div className="hidden text-right md:block">
                        <p className="text-sm font-semibold">
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