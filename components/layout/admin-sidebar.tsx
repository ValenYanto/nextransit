"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bus,
  CalendarClock,
  ClipboardCheck,
  Gauge,
  GitMerge,
  Map,
  MapPin,
  Route,
  Shapes,
  Sparkles,
  Waypoints,
  X,
} from "lucide-react";

const navGroups = [
  {
    label: null,
    items: [
      { title: "Overview", href: "/dashboard", icon: Gauge },
      { title: "Live Map", href: "/dashboard/live-map", icon: Map },
    ],
  },
  {
    label: "MANAGE",
    items: [
      { title: "Modes", href: "/dashboard/modes", icon: Shapes },
      { title: "Routes", href: "/dashboard/routes", icon: Route },
      { title: "Stops", href: "/dashboard/stops", icon: MapPin },
      { title: "Fleet", href: "/dashboard/fleet", icon: Bus },
      { title: "Schedules", href: "/dashboard/schedules", icon: CalendarClock },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { title: "Path Builder", href: "/dashboard/path-builder", icon: Waypoints },
      { title: "Interchanges", href: "/dashboard/interchanges", icon: GitMerge },
      { title: "Predictions", href: "/dashboard/predictions", icon: BarChart3 },
      { title: "Simulator", href: "/dashboard/simulator", icon: Sparkles },
      { title: "Case Alignment", href: "/dashboard/case-alignment", icon: ClipboardCheck },
    ],
  },
];

export function AdminSidebar({
  isOpen = true,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-60 bg-[#001011] text-[#FFFFFC] transition lg:sticky lg:top-0 lg:z-auto lg:block lg:min-h-screen ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="flex h-full flex-col px-4 py-5">
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="min-w-0">
            <p className="text-lg font-bold text-[#FFFFFC]">NexTransit</p>
            <p className="text-xs text-[#757780]">Operator Panel</p>
          </Link>
          {onClose ? (
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-[#757780] lg:hidden">
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <nav className="mt-6 flex-1 space-y-6 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label ?? "top"} className="space-y-2">
              {group.label ? (
                <p className="px-3 pb-1.5 pt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#757780]">
                  {group.label}
                </p>
              ) : null}
              {group.items.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-xl border-l-2 px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "border-[#6CCFF6] bg-[#6CCFF6]/10 pl-[10px] text-[#6CCFF6]"
                        : "border-transparent text-[#757780] hover:bg-white/5 hover:text-[#FFFFFC]"
                    }`}
                  >
                    <item.icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-[#6CCFF6]" : ""}`} />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="mt-6 flex items-center gap-3 border-t border-white/[0.06] p-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6CCFF6]/20 text-sm font-semibold text-[#6CCFF6]">
            OP
          </span>
          <span>
            <p className="text-sm font-medium text-[#FFFFFC]">Operator</p>
            <p className="text-xs text-[#757780]">ADMIN / OPERATOR</p>
          </span>
        </div>
      </div>
    </aside>
  );
}
