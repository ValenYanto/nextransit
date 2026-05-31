"use client";

import type { LucideIcon } from "lucide-react";

type ModeCardProps = {
  mode: {
    name: string;
    tagline: string;
    icon: LucideIcon;
  };
  isSelected: boolean;
  onClick: () => void;
  liveCount: number;
};

export function ModeCard({ mode, isSelected, onClick, liveCount }: ModeCardProps) {
  const Icon = mode.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative min-h-[120px] w-full cursor-pointer rounded-2xl border-2 p-5 text-left transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#6CCFF6]/30 ${
        isSelected
          ? "border-[#6CCFF6] bg-[#6CCFF6]/10 shadow-sm dark:bg-[#6CCFF6]/10"
          : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-[#6CCFF6]/50 hover:shadow-sm dark:border-white/[0.08] dark:bg-[#0d1f22]"
      }`}
    >
      <span className="absolute right-3 top-3 flex items-center gap-1 text-xs font-medium text-[#757780]">
        <span className="h-2 w-2 rounded-full bg-[#10B981] animate-live" />
        {liveCount} live
      </span>
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            isSelected ? "bg-[#6CCFF6] text-[#001011]" : "bg-[#f0fbff] text-[#6CCFF6] dark:bg-[#6CCFF6]/10"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className={`mt-4 text-base font-semibold ${isSelected ? "text-[#6CCFF6]" : "text-[#001011] dark:text-[#FFFFFC]"}`}>
        {mode.name}
      </p>
      <p className="mt-1 text-[13px] leading-5 text-[#757780]">{mode.tagline}</p>
    </button>
  );
}
