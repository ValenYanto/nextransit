import { Activity, Bus, Clock3, UsersRound } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { SimulatorPanel } from "@/components/simulator/simulator-panel";

export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
    const [vehicles, routes, taps] = await Promise.all([
        prisma.vehicle.count(),
        prisma.route.count(),
        prisma.passengerTap.findMany({
            take: 10,
            orderBy: { timestamp: "desc" },
        }),
    ]);

    const passengerMovement = taps.reduce(
        (sum, tap) => sum + tap.countIn + tap.countOut,
        0,
    );

    return (
        <div>
            <PageHeading
                label="Simulator"
                title="Operational scenario simulator"
                description="Simulasikan kondisi jam sibuk, hujan, atau event besar untuk melihat dampaknya terhadap ETA, kepadatan, dan kebutuhan armada."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Fleet Baseline"
                    value={vehicles}
                    description="Registered fleet"
                    icon={Bus}
                />
                <MetricCard
                    title="Route Baseline"
                    value={routes}
                    description="Available routes"
                    icon={Activity}
                />
                <MetricCard
                    title="Passenger Baseline"
                    value={passengerMovement}
                    description="Recent movement sample"
                    icon={UsersRound}
                />
                <MetricCard
                    title="Scenario Types"
                    value={4}
                    description="Normal, rush hour, rain, event"
                    icon={Clock3}
                />
            </div>

            <div className="mt-6">
                <SimulatorPanel />
            </div>
        </div>
    );
}
