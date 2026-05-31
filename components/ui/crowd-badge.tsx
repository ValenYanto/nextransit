type CrowdBadgeProps = {
  level: "low" | "moderate" | "high";
};

export function CrowdBadge({ level }: CrowdBadgeProps) {
  const styles = {
    low: "bg-[#10B981]/15 text-[#10B981]",
    moderate: "bg-[#F59E0B]/15 text-[#F59E0B]",
    high: "bg-[#EF4444]/15 text-[#EF4444]",
  };
  const labels = {
    low: "● Low",
    moderate: "● Moderate",
    high: "● High",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}
