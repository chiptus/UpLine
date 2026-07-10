import { addDays, format, parseISO } from "date-fns";
import { convertLocalTimeToUTC } from "@/lib/timeUtils";
import type { RevealLevel } from "@/lib/scheduleReveal";

export type FestivalPhase =
  | "pre-schedule"
  | "planning"
  | "live"
  | "post-festival";

export type FestivalPhaseInput = {
  revealLevel: RevealLevel;
  startDate: string | null;
  endDate: string | null;
  timezone: string;
  now: Date;
};

export function getFestivalPhase({
  revealLevel,
  startDate,
  endDate,
  timezone,
  now,
}: FestivalPhaseInput): FestivalPhase {
  if (revealLevel === "draft") return "pre-schedule";

  const liveStart = startDate
    ? zonedInstant(shiftDayKey(startDate, -1), "00:00:00", timezone)
    : null;
  if (!liveStart || now.getTime() < liveStart.getTime()) return "planning";

  const liveEnd = endDate
    ? zonedInstant(shiftDayKey(endDate, 1), "06:00:00", timezone)
    : null;
  if (!liveEnd || now.getTime() <= liveEnd.getTime()) return "live";

  return "post-festival";
}

// Shift a yyyy-MM-dd calendar day by whole days, staying a yyyy-MM-dd string.
function shiftDayKey(dateKey: string, delta: number): string {
  return format(addDays(parseISO(dateKey), delta), "yyyy-MM-dd");
}

// The UTC instant for a wall-clock day + time read in the festival timezone,
// via the same fromZonedTime-based helper the display path uses.
function zonedInstant(
  dateKey: string,
  time: string,
  timezone: string,
): Date | null {
  const iso = convertLocalTimeToUTC(`${dateKey} ${time}`, timezone);
  return iso ? new Date(iso) : null;
}
