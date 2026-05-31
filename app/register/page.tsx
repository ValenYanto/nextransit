import Link from "next/link";
import { BusFront } from "lucide-react";

import { RegisterForm } from "@/components/auth/register-form";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFFFFC] p-4 text-[#001011] dark:bg-[#001011] dark:text-[#FFFFFC]">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[#6CCFF6] text-[#001011]">
            <BusFront className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-3xl font-bold">NexTransit</h1>
          <p className="mt-2 text-sm text-[#757780]">Your city. Your route. Live.</p>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[#0a1a1c]">
          <h2 className="text-2xl font-bold">Create your account</h2>
          <p className="mt-2 text-sm text-[#757780]">
            Start tracking routes and planning easier trips.
          </p>

          <RegisterForm />

          <div className="my-6 flex items-center gap-3 text-xs text-[#757780]">
            <span className="h-px flex-1 bg-[#757780]/20" />
            or
            <span className="h-px flex-1 bg-[#757780]/20" />
          </div>

          <p className="text-center text-sm text-[#757780]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#6CCFF6] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
