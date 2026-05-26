import Link from "next/link";
import { Route } from "lucide-react";

type LogoProps = {
    href?: string;
};

export function Logo({ href = "/" }: LogoProps) {
    return (
        <Link href={href} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
                <Route className="h-5 w-5" />
            </div>
            <div className="leading-tight">
                <p className="text-base font-bold tracking-tight">NexTransit</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    AI Mobility System
                </p>
            </div>
        </Link>
    );
}