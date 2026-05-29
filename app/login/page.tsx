import Link from "next/link";
import { Suspense } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-6 dark:bg-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.18),transparent_32%)]" />

            <div className="absolute right-6 top-6">
                <ThemeToggle />
            </div>

            <Card className="relative w-full max-w-md rounded-[2rem] border-slate-200/80 bg-white/90 shadow-2xl shadow-cyan-500/10 backdrop-blur dark:border-white/10 dark:bg-white/5">
                <CardContent className="p-8">
                    <Logo />

                    <div className="mt-10">
                        <p className="font-semibold text-cyan-600 dark:text-cyan-300">
                            Welcome back
                        </p>
                        <h1 className="mt-2 font-[var(--font-jakarta)] text-4xl font-black tracking-tight">
                            Login to NexTransit
                        </h1>
                        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Access the operator dashboard, fleet monitoring, ETA prediction,
                            and intermodal intelligence system.
                        </p>
                    </div>

                    <Suspense
                        fallback={
                            <div className="mt-8 h-44 rounded-2xl bg-slate-100 dark:bg-white/5" />
                        }
                    >
                        <LoginForm />
                    </Suspense>

                    <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        Belum punya akun?{" "}
                        <Link
                            href="/register"
                            className="font-semibold text-cyan-600 hover:underline dark:text-cyan-300"
                        >
                            Register
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </main>
    );
}
