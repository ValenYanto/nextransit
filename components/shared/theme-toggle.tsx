"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setMounted(true);
        }, 0);

        return () => window.clearTimeout(timeout);
    }, []);

    if (!mounted) {
        return (
            <Button
                variant="outline"
                size="icon"
                className="rounded-xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-transparent"
                disabled
            >
                <Sun className="h-4 w-4" />
            </Button>
        );
    }

    const isDark = resolvedTheme === "dark";

    return (
        <Button
            variant="outline"
            size="icon"
            className="rounded-xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-transparent"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle theme"
        >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
    );
}
