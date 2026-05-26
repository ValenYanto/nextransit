import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/shared/logo";

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
            <Card className="w-full max-w-md rounded-3xl dark:border-white/10 dark:bg-white/5">
                <CardContent className="p-6">
                    <Logo />
                    <h1 className="mt-8 text-3xl font-black">Login</h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        Auth form will be implemented in Phase 2.
                    </p>
                    <Button asChild className="mt-6 w-full rounded-2xl">
                        <Link href="/dashboard">Continue to Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
}