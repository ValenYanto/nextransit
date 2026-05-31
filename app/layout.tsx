import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "NexTransit AI",
  description:
    "AI-powered ETA prediction and intermodal transit optimization platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-[#FFFFFC] font-sans text-[#001011] antialiased dark:bg-[#001011] dark:text-[#FFFFFC]">
        <ThemeProvider>
          <SessionProvider>
            {children}
            <Toaster richColors position="top-right" />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
