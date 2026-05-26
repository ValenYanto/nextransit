import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            <AppSidebar />

            <div className="flex min-w-0 flex-1 flex-col">
                <DashboardHeader />
                <main className="flex-1 px-6 py-6">{children}</main>
            </div>
        </div>
    );
}