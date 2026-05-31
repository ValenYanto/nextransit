import { Bell, Search } from "lucide-react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LogoutButton } from "@/components/auth/logout-button";

export async function DashboardHeader() {
    const session = await getServerSession(authOptions);

    return (
        <header className="sticky top-0 z-30 border-b border-black/10 bg-[#FFFFFC]/80 px-6 py-4 backdrop-blur dark:border-white/[0.07] dark:bg-[#001011]/80">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#757780]">
                        NexTransit
                    </p>
                    <h1 className="mt-1 text-lg font-semibold text-[#001011] dark:text-[#FFFFFC]">
                        Transit Control Center
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="hidden rounded-xl border-[#6CCFF6]/40 bg-white text-[#001011] shadow-none dark:border-white/[0.07] dark:bg-[#0a1a1c] dark:text-[#FFFFFC] md:flex"
                    >
                        <Search className="mr-2 h-4 w-4" />
                        Search
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl border-[#6CCFF6]/40 bg-white text-[#001011] shadow-none dark:border-white/[0.07] dark:bg-[#0a1a1c] dark:text-[#FFFFFC]"
                    >
                        <Bell className="h-4 w-4" />
                    </Button>

                    <ThemeToggle />

                    <div className="mx-2 hidden h-8 w-px bg-[#757780]/20 md:block" />

                    <div className="hidden text-right md:block">
                        <p className="text-sm font-medium text-[#001011] dark:text-[#FFFFFC]">
                            {session?.user?.name ?? "Operator"}
                        </p>
                        <p className="text-xs text-[#757780]">
                            {session?.user?.role ?? "OPERATOR"}
                        </p>
                    </div>

                    <LogoutButton />
                </div>
            </div>
        </header>
    );
}
