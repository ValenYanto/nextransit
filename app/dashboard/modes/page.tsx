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

            <Card className="mt-6 rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                <CardContent className="p-5">
                    <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                        Add or update mode
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Manage the service families used by passenger routing and operator
                        reporting.
                    </p>
                    <form action={createMode} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <input name="name" required placeholder="Mode name" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                        <input name="slug" required placeholder="Slug" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                        <input name="description" placeholder="Description" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900 xl:col-span-2" />
                        <input name="icon" placeholder="Icon key" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                        <input name="color" placeholder="#0891b2" className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900" />
                        <Button className="h-10 rounded-xl bg-slate-950 text-white shadow-none dark:bg-white dark:text-slate-950 md:col-span-2 xl:col-span-4">
                            Save mode
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {modes.map((mode) => (
                    <Card
                        key={mode.id}
                        className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950"
                    >
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">
                                        {mode.slug}
                                    </p>
                                    <h2 className="mt-2 font-[var(--font-jakarta)] text-xl font-semibold">
                                        {mode.name}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                                        {mode.description ?? "No description available."}
                                    </p>
                                </div>
                                <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
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
