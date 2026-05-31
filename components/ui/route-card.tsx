"use client";

type RouteCardProps = {
  route: {
    code: string;
    name: string;
    origin: string;
    destination: string;
    vehicleCount?: number;
    stopCount?: number;
  };
  onTrack: () => void;
  buttonLabel?: string;
};

export function RouteCard({ route, onTrack, buttonLabel = "Track Live" }: RouteCardProps) {
  return (
    <article className="card rounded-2xl border border-[#e5e7eb] bg-white p-4 transition hover:border-[#6CCFF6]/50 hover:shadow-sm dark:border-[#6CCFF6]/10 dark:bg-[#0d1f22]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#6CCFF6]/10 px-2 py-0.5 font-mono text-xs font-semibold text-[#6CCFF6]">
              {route.code}
            </span>
            <span className="flex items-center gap-2 text-xs font-medium text-[#757780]">
              <span className="h-2 w-2 rounded-full bg-[#10B981] animate-live" />
              Live
            </span>
          </div>
          <h3 className="mt-3 truncate text-[15px] font-medium text-[#001011] dark:text-[#FFFFFC]">
            {route.name}
          </h3>
          <p className="mt-1 text-[13px] text-[#757780]">
            {route.origin} → {route.destination}
          </p>
          <p className="mt-2 text-xs text-[#757780]">
            {route.vehicleCount ?? 0} live units · {route.stopCount ?? 0} stops
          </p>
        </div>
        <button
          type="button"
          onClick={onTrack}
          className="min-h-10 rounded-[10px] border-[1.5px] border-[#6CCFF6] px-4 py-1.5 text-[13px] font-medium text-[#6CCFF6] hover:bg-[#6CCFF6] hover:text-[#001011] sm:shrink-0"
        >
          {buttonLabel}
        </button>
      </div>
    </article>
  );
}
