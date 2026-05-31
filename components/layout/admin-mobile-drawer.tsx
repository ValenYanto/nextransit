"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { AdminSidebar } from "@/components/layout/admin-sidebar";

export function AdminMobileDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl bg-[#001011] text-[#FFFFFC] shadow-sm lg:hidden"
        aria-label="Open admin navigation"
      >
        <Menu className="h-5 w-5" />
      </button>
      {open ? (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-[#001011]/60 lg:hidden"
        />
      ) : null}
      <div className="lg:hidden">
        <AdminSidebar isOpen={open} onClose={() => setOpen(false)} />
      </div>
    </>
  );
}
