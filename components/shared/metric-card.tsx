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
        <Card className="rounded-2xl border-gray-100 bg-white shadow-none dark:border-white/[0.07] dark:bg-[#0d1f22]">
            <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="mb-1 text-sm font-medium text-[#757780]">
                            {title}
                        </p>

                        <p className="text-4xl font-bold leading-none text-[#001011] dark:text-[#FFFFFC]">
                            {value}
                        </p>

                        {description ? (
                            <p className="mt-2 text-xs text-[#757780]">
                                {description}
                            </p>
                        ) : null}
                    </div>

                    {Icon ? (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6CCFF6]/10">
                            <Icon className="h-5 w-5 text-[#6CCFF6]" />
                        </div>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
