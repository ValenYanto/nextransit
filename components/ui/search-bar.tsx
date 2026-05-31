"use client";

import { Search } from "lucide-react";

type SearchBarProps = {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ placeholder, value, onChange }: SearchBarProps) {
  return (
    <label className="flex h-[52px] items-center gap-3 rounded-[14px] border-[1.5px] border-[#e5e7eb] bg-white px-4 focus-within:border-[#6CCFF6] focus-within:shadow-[0_0_0_3px_rgba(108,207,246,0.15)] dark:border-white/[0.07] dark:bg-[#0d1f22]">
      <Search className="h-5 w-5 shrink-0 text-[#757780]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent text-base text-[#001011] outline-none placeholder:text-[#757780] focus:ring-0 dark:text-[#FFFFFC]"
      />
    </label>
  );
}
