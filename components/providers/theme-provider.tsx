"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
    theme: Theme;
    resolvedTheme: "light" | "dark";
    setTheme: (theme: Theme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
    children: React.ReactNode;
};

function getSystemTheme() {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

function applyTheme(theme: Theme) {
    const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    return resolvedTheme;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [theme, setThemeState] = React.useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");

    React.useEffect(() => {
        const timeout = window.setTimeout(() => {
            const storedTheme = window.localStorage.getItem("nextransit-theme") as Theme | null;
            const initialTheme =
                storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
                    ? storedTheme
                    : "system";

            setThemeState(initialTheme);
            setResolvedTheme(applyTheme(initialTheme));
        }, 0);

        return () => window.clearTimeout(timeout);
    }, []);

    React.useEffect(() => {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = () => {
            if (theme === "system") {
                setResolvedTheme(applyTheme("system"));
            }
        };

        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, [theme]);

    const setTheme = React.useCallback((nextTheme: Theme) => {
        window.localStorage.setItem("nextransit-theme", nextTheme);
        setThemeState(nextTheme);
        setResolvedTheme(applyTheme(nextTheme));
    }, []);

    const value = React.useMemo(
        () => ({
            theme,
            resolvedTheme,
            setTheme,
        }),
        [theme, resolvedTheme, setTheme],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = React.useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider.");
    }

    return context;
}
