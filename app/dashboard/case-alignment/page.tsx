import { CheckCircle2, Clock3, ClipboardCheck, Gauge, Layers3 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { StatusBadge } from "@/components/shared/status-badge";

const problemMappings = [
    ["Uncertain bus/feeder arrival times", "ETA prediction and route-based live tracking", "Implemented"],
    ["Suboptimal MRT/LRT/bus integration", "Intermodal journey planner and transfer recommendations", "Implemented"],
    ["Lack of data synchronization", "Integrated modes, routes, stops, fleet, schedule, and path database", "Implemented"],
    ["Fluctuating traffic and demand", "Simulator, speed factors, occupancy, and crowd-level logic", "Partial"],
];

const aiCapabilities = [
    ["Accurate arrival time prediction", "Rule-based MVP with speed, geometry distance, and crowd/traffic factors", "Partial"],
    ["Adaptive schedule optimization", "Headway and simulator signals are present; optimization engine is planned", "Partial"],
    ["Bus ETA based on traffic", "OSRM road geometry plus speed/traffic-level ETA factors", "Implemented"],
    ["Intermodal schedule optimization", "Basic journey planner supports direct and one-transfer options", "Partial"],
    ["Passenger density detection", "VehicleOccupancy model, crowd levels, and boarding recommendation", "Implemented"],
    ["App/website integration", "Passenger app and operator dashboard are integrated in Next.js", "Implemented"],
];

const outputs = [
    ["Model", "ETA, crowd, route recommendation, and boarding utilities", "Partial"],
    ["Dashboard", "Operator pages for routes, stops, fleet, schedules, path builder, and simulation", "Implemented"],
    ["Simulator", "Vehicle movement along RoutePathPoint with occupancy and speed demo data", "Implemented"],
    ["Executive summary", "This status page documents scope; export/report generation remains planned", "Partial"],
];

const remaining = [
    "Replace simulation with official GTFS-Realtime or operator GPS feed when available.",
    "Train ML models beyond current rule-based ETA and crowd logic.",
    "Expand admin CRUD with edit/delete flows and audit history.",
    "Add downloadable executive report export.",
];

export const dynamic = "force-dynamic";

export default function CaseAlignmentPage() {
    return (
        <div>
            <PageHeading
                label="DISHUB Case 2"
                title="Public transit optimization alignment"
                description="A clear status page for what NexTransit already demonstrates, what is partial, and what remains for production readiness."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard title="Passenger App" value="Implemented" description="Journey planner and live route tracking" icon={CheckCircle2} />
                <MetricCard title="Operator Dashboard" value="Implemented" description="Network management workspace" icon={ClipboardCheck} />
                <MetricCard title="AI Logic" value="Rule-based" description="Ready for ML replacement" icon={Gauge} />
                <MetricCard title="Realtime Feed" value="Simulated" description="Provider-ready architecture" icon={Clock3} />
            </div>

            <StatusSection title="Problem Statement Mapping" items={problemMappings} />
            <StatusSection title="Required AI Capabilities" items={aiCapabilities} />
            <StatusSection title="Expected Output" items={outputs} />

            <Card className="mt-6 rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
                <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                        <Layers3 className="mt-1 h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                        <div>
                            <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">
                                Remaining production improvements
                            </h2>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                {remaining.map((item) => (
                                    <div key={item} className="rounded-xl border border-slate-200 p-3 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatusSection({
    title,
    items,
}: {
    title: string;
    items: string[][];
}) {
    return (
        <Card className="mt-6 rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
            <CardContent className="p-5">
                <h2 className="font-[var(--font-jakarta)] text-lg font-semibold">{title}</h2>
                <div className="mt-4 space-y-3">
                    {items.map(([problem, solution, status]) => (
                        <div
                            key={`${title}-${problem}`}
                            className="grid gap-3 rounded-xl border border-slate-200 p-4 dark:border-white/10 lg:grid-cols-[0.8fr_1fr_auto] lg:items-center"
                        >
                            <p className="text-sm font-medium text-slate-950 dark:text-white">{problem}</p>
                            <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">{solution}</p>
                            <StatusBadge status={status} />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
