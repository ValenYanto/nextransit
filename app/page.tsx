import Link from "next/link";
import type { ComponentType } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bus,
  Clock3,
  GitMerge,
  MapPinned,
  Radio,
  Route,
  ShieldCheck,
  UsersRound,
  Waypoints,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Logo } from "@/components/shared/logo";

const problems = [
  "Uncertain arrival times across corridors",
  "Fragmented bus, feeder, MRT, and LRT schedules",
  "Passenger crowding is hard to anticipate",
  "Weak first-mile and last-mile visibility",
];

const solutions = [
  { title: "Route-based live tracking", icon: Route, description: "Passengers choose a mode and corridor, then see every active vehicle on that route." },
  { title: "ETA prediction", icon: Clock3, description: "Arrival estimates combine vehicle speed, route distance, crowd level, and traffic conditions." },
  { title: "Crowd-aware recommendation", icon: UsersRound, description: "Density signals help passengers and operators avoid overloaded services." },
  { title: "Intermodal intelligence", icon: GitMerge, description: "Transfer points connect feeder, TransJakarta, MRT, and LRT journeys." },
  { title: "Operator monitoring", icon: BarChart3, description: "Dashboards surface fleet status, delays, route performance, and simulation outputs." },
];

const caseItems = [
  "Accurate ETA prediction",
  "Feeder/MRT/LRT integration",
  "Passenger density monitoring",
  "Rush hour transfer simulation",
  "Fleet status tracking",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400 md:flex">
            <a href="#features" className="hover:text-slate-950 dark:hover:text-white">Features</a>
            <a href="#tracking" className="hover:text-slate-950 dark:hover:text-white">Live Tracking</a>
            <a href="#intermodal" className="hover:text-slate-950 dark:hover:text-white">Intermodal</a>
            <Link href="/dashboard" className="hover:text-slate-950 dark:hover:text-white">Dashboard</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline" className="hidden rounded-xl bg-white shadow-none dark:border-white/10 dark:bg-transparent sm:inline-flex">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="rounded-xl bg-slate-950 text-white shadow-none hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
              <Link href="/passenger">Open Passenger App</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
        <div>
          <div className="inline-flex rounded-full border border-cyan-200 bg-white px-3 py-1 text-sm font-medium text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300">
            DISHUB Case 2 · Public Transit Optimization
          </div>
          <h1 className="mt-5 max-w-4xl font-[var(--font-jakarta)] text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
            Plan, track, and transfer smarter across Jakarta&apos;s public transit.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
            NexTransit brings bus, feeder, MRT, and LRT data into one
            AI-powered live tracking platform with ETA prediction, crowd
            insights, and intermodal route recommendations.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-2xl bg-cyan-600 text-white shadow-none hover:bg-cyan-700">
              <Link href="/passenger">
                Start Tracking
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-transparent">
              <Link href="/dashboard">Operator Dashboard</Link>
            </Button>
          </div>
        </div>

        <HeroMockup />
      </section>

      <section className="border-y border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/40">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-12 md:grid-cols-4">
          {problems.map((problem) => (
            <div key={problem} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
              <ShieldCheck className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
              <p className="mt-4 text-sm font-medium leading-6">{problem}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-16">
        <SectionHeading
          label="Solution"
          title="A single operating layer for passenger and operator decisions."
          description="NexTransit keeps the interface calm while surfacing the signals that matter: where vehicles are, how crowded they are, and where passengers should transfer."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {solutions.map((item) => (
            <Card key={item.title} className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
              <CardContent className="p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-[var(--font-jakarta)] text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="tracking" className="mx-auto grid max-w-7xl gap-6 px-5 pb-16 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">Live tracking preview</p>
                <h2 className="mt-1 font-[var(--font-jakarta)] text-2xl font-semibold">K1 Blok M - Kota</h2>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">Live</span>
            </div>
            <div className="relative h-80 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
              <div className="absolute inset-x-8 top-1/2 h-1 -translate-y-1/2 rounded-full bg-cyan-500" />
              <div className="absolute left-[18%] top-[54%] h-3 w-3 rounded-full bg-slate-950 ring-4 ring-white dark:bg-white dark:ring-slate-950" />
              <div className="absolute left-[48%] top-[46%] h-3 w-3 rounded-full bg-slate-950 ring-4 ring-white dark:bg-white dark:ring-slate-950" />
              <div className="absolute left-[77%] top-[50%] h-3 w-3 rounded-full bg-slate-950 ring-4 ring-white dark:bg-white dark:ring-slate-950" />
              <div className="absolute left-[34%] top-[42%] rounded-full bg-cyan-600 px-3 py-1 text-xs font-semibold text-white">TJ-K1-01</div>
              <div className="absolute left-[62%] top-[56%] rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">TJ-K1-02</div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {[
            ["Passenger location", "Manual/GPS source, nearest stop, and accuracy radius"],
            ["Vehicle list", "ETA, crowd level, passenger count, speed, and next stop"],
            ["Transfer guidance", "Bundaran HI and Harmoni surfaced as route decisions"],
          ].map(([title, description]) => (
            <Card key={title} className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
              <CardContent className="p-5">
                <p className="font-medium">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
          <CardContent className="grid gap-6 p-5 lg:grid-cols-[0.9fr_1.1fr] lg:p-6">
            <div>
              <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">
                Operator dashboard preview
              </p>
              <h2 className="mt-2 font-[var(--font-jakarta)] text-2xl font-semibold">
                Manage modes, routes, stops, fleet, schedules, and path geometry.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Operators can monitor crowded vehicles, rebuild OSRM-based bus
                paths, simulate movement, and inspect interchange risks from the
                same clean workspace.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MockMetric icon={Bus} label="Fleet" value="11 live units" />
              <MockMetric icon={Waypoints} label="Path Builder" value="OSRM ready" />
              <MockMetric icon={BarChart3} label="Reliability" value="91%" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="intermodal" className="border-t border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-5 py-16">
          <SectionHeading
            label="Case 2 Alignment"
            title="Built around ETA reliability, transfer risk, and passenger density."
            description="The MVP demonstrates how integrated data can improve route recommendations and operator decisions during busy Jakarta corridors."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {caseItems.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium dark:border-white/10 dark:bg-white/5">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-[var(--font-jakarta)] text-2xl font-semibold">Ready to demo NexTransit?</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Open the passenger dashboard or operator control center.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="rounded-xl bg-cyan-600 text-white shadow-none hover:bg-cyan-700">
                <Link href="/passenger">Open Passenger Dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl bg-white shadow-none dark:border-white/10 dark:bg-transparent">
                <Link href="/login">Login as Operator</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroMockup() {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-slate-950">
      <CardContent className="p-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Route live</p>
              <h2 className="mt-1 font-[var(--font-jakarta)] text-2xl font-semibold">K1 Blok M - Kota</h2>
            </div>
            <Radio className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <MockMetric icon={Bus} label="Live units" value="2" />
            <MockMetric icon={Clock3} label="Next ETA" value="7 min" />
            <MockMetric icon={UsersRound} label="Crowd" value="LOW" />
            <MockMetric icon={MapPinned} label="Transfer" value="Bundaran HI" />
          </div>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
              ETA reliability 91%
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <div className="h-full w-[91%] rounded-full bg-cyan-500" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MockMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950">
      <Icon className="h-4 w-4 text-slate-400" />
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function SectionHeading({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">{label}</p>
      <h2 className="mt-2 font-[var(--font-jakarta)] text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}
