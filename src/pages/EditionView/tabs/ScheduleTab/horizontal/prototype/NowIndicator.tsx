// PROTOTYPE (timeline nav & filtering) — throwaway, delete with this folder.
//
// Three visual treatments for the current-time line, one per variant, to
// answer "enough contrast against the purple/white-on-dark styling without
// shouting?"
import { formatInTimeZone } from "date-fns-tz";

interface NowIndicatorProps {
  left: number;
  now: Date;
  timezone: string;
  treatment: "line" | "bubble" | "dashed";
}

export function NowIndicator({
  left,
  now,
  timezone,
  treatment,
}: NowIndicatorProps) {
  if (treatment === "bubble") {
    return (
      <div
        className="absolute inset-y-0 z-20 pointer-events-none"
        style={{ left: `${left}px` }}
      >
        <div className="absolute inset-y-0 w-0.5 bg-gradient-to-b from-fuchsia-400 via-fuchsia-400/60 to-transparent" />
        <div className="absolute top-0 -translate-x-1/2 rounded-full bg-fuchsia-500 px-2 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap shadow-lg">
          now {formatInTimeZone(now, timezone, "HH:mm")}
        </div>
      </div>
    );
  }

  if (treatment === "dashed") {
    return (
      <div
        className="absolute inset-y-0 z-20 pointer-events-none border-l-2 border-dashed border-white/50"
        style={{ left: `${left}px` }}
      >
        <div className="absolute top-0 h-2 w-2 -translate-x-[5px] rounded-full bg-white/80" />
      </div>
    );
  }

  return (
    <div
      className="absolute inset-y-0 z-20 pointer-events-none"
      style={{ left: `${left}px` }}
    >
      <div className="absolute inset-y-0 w-0.5 bg-fuchsia-400/90" />
      <div className="absolute top-0 h-2 w-2 -translate-x-[3px] rounded-full bg-fuchsia-400" />
    </div>
  );
}
