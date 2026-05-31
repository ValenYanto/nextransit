import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Bus, Route, Shapes } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";

export const dynamic = "force-dynamic";

const modeSchema = z.object({
    name: z.string().trim().min(2).max(80),
    slug: z.string().trim().min(2).max(80),
    description: z.string().trim().optional(),
    color: z.string().trim().optional(),
    icon: z.string().trim().optional(),
});

async function createMode(formData: FormData) {
    "use server";

    const parsed = modeSchema.safeParse({
        name: String(formData.get("name") ?? ""),
        slug: String(formData.get("slug") ?? ""),
        description: String(formData.get("description") ?? ""),
        color: String(formData.get("color") ?? ""),
        icon: String(formData.get("icon") ?? ""),
    });

    if (!parsed.success) return;

    await prisma.transportMode.upsert({
        where: { slug: parsed.data.slug },
        update: {
            name: parsed.data.name,
            description: parsed.data.description || null,
            color: parsed.data.color || null,
            icon: parsed.data.icon || null,
            isActive: true,
        },
        create: {
            name: parsed.data.name,
            slug: parsed.data.slug,
            description: parsed.data.description || null,
            color: parsed.data.color || null,
            icon: parsed.data.icon || null,
            isActive: true,
        },
    });

    revalidatePath("/dashboard/modes");
}

export default async function ModesPage() {
    const modes = await prisma.transportMode.findMany({
        orderBy: { name: "asc" },
        include: {
            _count: {
                select: { routes: true },
            },
        },
    });

    const activeModes = modes.filter((mode) => mode.isActive).length;
    const totalRoutes = modes.reduce((sum, mode) => sum + mode._count.routes, 0);

    return (
        <div>
            <PageHeading
                label="Modes"
                title="Transport mode registry"
                description="Operator-ready overview for TransJakarta, MRT, LRT, feeder, and school bus service groups."
            />

            <div className="grid gap-4 md:grid-cols-3">
                <MetricCard title="Modes" value={modes.length} description={`${activeModes} active`} icon={Shapes} />
                <MetricCard title="Connected Routes" value={totalRoutes} description="Corridors and lines" icon={Route} />
                <MetricCard title="Service Scope" value="Integrated" description="DISHUB Case 2 mobility network" icon={Bus} />
            </div>

            <Card className="mt-6 rounded-2xl border-gray-100 bg-white shadow-none dark:border-white/[0.07] dark:bg-[#0d1f22]">
                <CardContent className="p-5">
                    <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                        Add or update mode
                    </h2>
                    <p className="mt-1 text-sm text-[#757780]">
                        Manage the service families used by passenger routing and operator
                        reporting.
                    </p>
                    <form action={createMode} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <input name="name" required placeholder="Mode name" className="h-11 rounded-xl border border-gray-200 bg-[#f9fafb] px-4 text-sm text-[#001011] outline-none placeholder:text-[#757780] focus:border-[#6CCFF6] focus:ring-2 focus:ring-[#6CCFF6]/20 dark:border-white/[0.08] dark:bg-[#001011] dark:text-[#FFFFFC]" />
                        <input name="slug" required placeholder="Slug" className="h-11 rounded-xl border border-gray-200 bg-[#f9fafb] px-4 text-sm text-[#001011] outline-none placeholder:text-[#757780] focus:border-[#6CCFF6] focus:ring-2 focus:ring-[#6CCFF6]/20 dark:border-white/[0.08] dark:bg-[#001011] dark:text-[#FFFFFC]" />
                        <input name="description" placeholder="Description" className="h-11 rounded-xl border border-gray-200 bg-[#f9fafb] px-4 text-sm text-[#001011] outline-none placeholder:text-[#757780] focus:border-[#6CCFF6] focus:ring-2 focus:ring-[#6CCFF6]/20 dark:border-white/[0.08] dark:bg-[#001011] dark:text-[#FFFFFC] xl:col-span-2" />
                        <input name="icon" placeholder="Icon key" className="h-11 rounded-xl border border-gray-200 bg-[#f9fafb] px-4 text-sm text-[#001011] outline-none placeholder:text-[#757780] focus:border-[#6CCFF6] focus:ring-2 focus:ring-[#6CCFF6]/20 dark:border-white/[0.08] dark:bg-[#001011] dark:text-[#FFFFFC]" />
                        <input name="color" placeholder="#6CCFF6" className="h-11 rounded-xl border border-gray-200 bg-[#f9fafb] px-4 font-mono text-sm text-[#001011] outline-none placeholder:text-[#757780] focus:border-[#6CCFF6] focus:ring-2 focus:ring-[#6CCFF6]/20 dark:border-white/[0.08] dark:bg-[#001011] dark:text-[#FFFFFC]" />
                        <Button className="h-11 rounded-xl bg-[#6CCFF6] font-semibold text-[#001011] shadow-none md:col-span-2 xl:col-span-4">
                            Save mode
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {modes.map((mode) => (
                    <Card
                        key={mode.id}
                        className="rounded-2xl border-gray-100 bg-white shadow-none dark:border-white/[0.07] dark:bg-[#0d1f22]"
                    >
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="inline-flex rounded-full bg-[#6CCFF6]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#6CCFF6]">
                                        {mode.slug}
                                    </p>
                                    <h2 className="mt-3 text-lg font-semibold text-[#001011] dark:text-[#FFFFFC]">
                                        {mode.name}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-[#757780]">
                                        {mode.description ?? "No description available."}
                                    </p>
                                </div>
                                <span className="rounded-full px-2.5 py-0.5 text-xs text-[#757780]">
                                    {mode._count.routes} routes
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
