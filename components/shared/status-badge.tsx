import { Badge } from "@/components/ui/badge";

type StatusBadgeProps = {
    status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
    const normalized = status.toUpperCase();

    const className =
        normalized === "ACTIVE" || normalized === "LOW"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
            : normalized === "DELAYED" ||
                normalized === "MEDIUM" ||
                normalized === "FEEDER"
                ? "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300"
                : normalized === "HIGH" ||
                    normalized === "BUS" ||
                    normalized === "MRT" ||
                    normalized === "LRT"
                    ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300"
                    : normalized === "CRITICAL" ||
                        normalized === "MAINTENANCE" ||
                        normalized === "OFFLINE"
                        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300"
                        : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";

    return (
        <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 ${className}`}>
            {status}
        </Badge>
    );
}