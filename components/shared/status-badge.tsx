import { Badge } from "@/components/ui/badge";

type StatusBadgeProps = {
    status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
    const normalized = status.toUpperCase();

    const className =
        normalized === "ACTIVE" || normalized === "LOW"
            ? "border-[#10B981]/40 bg-[#10B981]/15 text-[#10B981] dark:border-[#10B981]/30 dark:bg-[#10B981]/10 dark:text-[#10B981]"
            : normalized === "DELAYED" ||
                normalized === "MEDIUM" ||
                normalized === "FEEDER"
                ? "border-[#6CCFF6]/40 bg-[#6CCFF6]/15 text-[#006989] dark:border-[#6CCFF6]/30 dark:bg-[#6CCFF6]/10 dark:text-[#6CCFF6]"
                : normalized === "HIGH" ||
                normalized === "BUS" ||
                normalized === "MRT" ||
                normalized === "LRT"
                    ? "border-[#6CCFF6]/40 bg-[#6CCFF6]/10 text-[#006989] dark:border-[#6CCFF6]/30 dark:bg-[#6CCFF6]/10 dark:text-[#6CCFF6]"
                    : normalized === "CRITICAL" ||
                        normalized === "MAINTENANCE" ||
                        normalized === "OFFLINE"
                        ? "border-[#757780]/40 bg-[#757780]/10 text-[#757780] dark:border-[#757780]/40 dark:bg-[#757780]/10 dark:text-[#757780]"
                        : "border-black/10 bg-[#FFFFFC] text-[#757780] dark:border-white/[0.07] dark:bg-white/5 dark:text-[#757780]";

    return (
        <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 ${className}`}>
            {status}
        </Badge>
    );
}
