import { Check, Clock3, Zap } from "lucide-react";

type BoardingAdviceProps = {
  advice: "board" | "urgent" | "wait";
};

export function BoardingAdvice({ advice }: BoardingAdviceProps) {
  const config = {
    board: {
      icon: Check,
      label: "Good to board",
      className: "border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]",
    },
    urgent: {
      icon: Zap,
      label: "Board if urgent",
      className: "border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]",
    },
    wait: {
      icon: Clock3,
      label: "Better wait for next",
      className: "border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]",
    },
  }[advice];
  const Icon = config.icon;

  return (
    <div className={`flex w-full items-center gap-3 rounded-xl border p-4 ${config.className}`}>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-current/15">
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-[15px] font-semibold">{config.label}</p>
    </div>
  );
}
