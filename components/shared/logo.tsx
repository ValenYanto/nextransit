import Link from "next/link";
import { Route } from "lucide-react";

type LogoProps = {
    href?: string;
};

export function Logo({ href = "/" }: LogoProps) {
    return (
        <Link href={href} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#6CCFF6] text-[#001011] shadow-sm">
                <Route className="h-5 w-5" />
            </div>
            <div className="leading-tight">
                <p className="text-base font-bold tracking-tight">NexTransit</p>
                <p className="text-xs text-[#757780]">
                    AI Mobility System
                </p>
            </div>
        </Link>
    );
}
