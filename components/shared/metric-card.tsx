import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type MetricCardProps = {
    title: string;
    value: string | number;
    description?: string;
    icon?: LucideIcon;
};

export function MetricCard({
    title,
    value,
    description,
    icon: Icon,
}: MetricCardProps) {
    return (
        <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {title}
                        </p>

                        <p className="mt-2 font-[var(--font-jakarta)] text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                            {value}
                        </p>

                        {description ? (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                                {description}
                            </p>
                        ) : null}
                    </div>

                    {Icon ? (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400">
                            <Icon className="h-4 w-4" />
                        </div>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}