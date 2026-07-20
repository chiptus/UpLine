import { isValid, parseISO } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import type { ScheduleWindow } from "@/lib/timelineCalculator";

export interface TimelineMountMomentInput {
  scrollTo?: string;
  day: string;
  timezone: string;
  festivalStart: Date;
  scheduleWindow: ScheduleWindow | null;
  now: Date;
}

const NOW_CONTEXT_MS = 60 * 60 * 1000; // ~1h of context before "now"

/** Mount-precedence order: scrollTo -> day filter -> now-1h -> festival start. */
export function resolveTimelineMountMoment(
  input: TimelineMountMomentInput,
): Date {
  return (
    momentFromScrollTo(input.scrollTo) ??
    momentFromDayFilter(input.day, input.timezone) ??
    momentFromNow(input.now, input.scheduleWindow) ??
    input.festivalStart
  );
}

/**
 * Inclusive check of `now` against a festival window (set times, not the
 * edition's raw UTC-midnight start/end dates).
 */
export function isNowWithinFestivalWindow(
  now: Date,
  festivalStart: Date,
  festivalEnd: Date,
): boolean {
  return (
    now.getTime() >= festivalStart.getTime() &&
    now.getTime() <= festivalEnd.getTime()
  );
}

function momentFromScrollTo(scrollTo: string | undefined): Date | null {
  if (!scrollTo) return null;
  const parsed = parseISO(scrollTo);
  return isValid(parsed) ? parsed : null;
}

function momentFromDayFilter(day: string, timezone: string): Date | null {
  if (!day || day === "all") return null;
  try {
    const dayStart = fromZonedTime(`${day}T00:00:00`, timezone);
    return isValid(dayStart) ? dayStart : null;
  } catch {
    return null;
  }
}

function momentFromNow(
  now: Date,
  scheduleWindow: ScheduleWindow | null,
): Date | null {
  if (!scheduleWindow) return null;
  if (!isNowWithinFestivalWindow(now, scheduleWindow.start, scheduleWindow.end))
    return null;
  return new Date(
    Math.max(now.getTime() - NOW_CONTEXT_MS, scheduleWindow.start.getTime()),
  );
}

export function roundToNearestMinutes(date: Date, minutes = 5): Date {
  const ms = minutes * 60 * 1000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}
