import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { AdminMobileDrawer } from "@/components/layout/admin-mobile-drawer";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-[#FFFFFC] text-[#001011] dark:bg-[#001011] dark:text-[#FFFFFC]">
            <div className="hidden lg:block">
                <AppSidebar />
            </div>
            <AdminMobileDrawer />

            <div className="flex min-w-0 flex-1 flex-col">
                <DashboardHeader />
                <main className="flex-1 px-4 py-5 pt-16 sm:px-6 lg:pt-5">{children}</main>
            </div>
        </div>
    );
}
