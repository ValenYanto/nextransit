"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { BusFront, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";

type PassengerHeaderProps = {
  transparent?: boolean;
};

export function PassengerHeader({ transparent = false }: PassengerHeaderProps) {
  const { data: session } = useSession();

  return (
    <header
      className={`sticky top-0 z-40 border-b border-black/10 backdrop-blur dark:border-white/[0.07] ${
        transparent ? "bg-[#FFFFFC]/80 dark:bg-[#001011]/80" : "bg-[#FFFFFC] dark:bg-[#001011]"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#6CCFF6] text-[#001011]">
            <BusFront className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-bold text-[#001011] dark:text-[#FFFFFC]">
              NexTransit
            </span>
            <span className="block text-[11px] font-medium text-[#757780]">
              AI Mobility System
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {session ? (
            <Link
              href="/passenger/dashboard"
              className="flex min-h-11 items-center gap-2 rounded-xl border border-black/10 px-3 text-sm font-medium text-[#001011] dark:border-white/[0.07] dark:text-[#FFFFFC]"
            >
              <span className="hidden max-w-32 truncate sm:block">
                {session.user?.name ?? "Passenger"}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6CCFF6]/15 text-[#6CCFF6]">
                <UserRound className="h-4 w-4" />
              </span>
            </Link>
          ) : (
            <Button
              asChild
              variant="ghost"
              className="min-h-11 rounded-xl px-4 text-[#001011] hover:bg-[#6CCFF6]/10 dark:text-[#FFFFFC]"
            >
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
