import { isValid, parseISO } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import type { ScheduleWindow } from "@/lib/timelineCalculator";

export interface TimelineMountMomentInput {
  /** Raw `scrollTo` search param, if present in the URL. */
  scrollTo?: string;
  /** Active day filter: "all" or a "yyyy-MM-dd" festival calendar day. */
  day: string;
  /** Festival's IANA timezone, used to resolve the day filter's start. */
  timezone: string;
  /** Timeline geometry origin (earliest moment on the rendered strip). */
  festivalStart: Date;
  /**
   * The UNFILTERED schedule's window (see `calculateScheduleWindow`), used
   * by the now-rule so an active stage/time filter can't shrink the window
   * and suppress the rule mid-festival. Null when no set has a time yet.
   */
  scheduleWindow: ScheduleWindow | null;
  /** Current moment, injected by the caller (never computed in here). */
  now: Date;
}

const NOW_CONTEXT_MS = 60 * 60 * 1000; // ~1h of context before "now"

/**
 * Decides which moment the timeline viewport should be centered on when the
 * Timeline mounts. Pure and order-sensitive:
 *
 *   1. `scrollTo` from the URL, if present and parseable.
 *   2. The start of the active `day` filter, if one is set.
 *   3. Now minus ~1h of context (clamped to the window start), if `now`
 *      falls inside the unfiltered schedule window.
 *   4. The festival start (timeline origin), as the final fallback.
 */
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
 * Whether `now` falls inside a festival window (inclusive of both ends).
 * The window comes from actual set times rather than the edition's raw
 * `start_date`/`end_date` calendar dates, which - parsed at UTC midnight -
 * would risk the last festival day's evening sets reading as "outside".
 * Two windows are relevant, and they differ when filters are active:
 *
 *   - The UNFILTERED schedule window (`calculateScheduleWindow`) gates the
 *     Now pill and the mount-precedence now-rule, so a stage/time filter
 *     can't hide time-awareness mid-festival as a side effect.
 *   - The rendered strip's bounds (`TimelineData.festivalStart`/
 *     `festivalEnd`, computed from the FILTERED subset) gate the
 *     current-time indicator, which can only be drawn meaningfully on the
 *     strip that's actually rendered.
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
  // Clamped so a "now" within the window's first hour doesn't resolve to a
  // moment before the window even opens.
  return new Date(
    Math.max(now.getTime() - NOW_CONTEXT_MS, scheduleWindow.start.getTime()),
  );
}

/**
 * Rounds a moment to the nearest multiple of `minutes` (default 5), used to
 * keep `scrollTo` URL writes coarse-grained instead of pixel-precise.
 */
export function roundToNearestMinutes(date: Date, minutes = 5): Date {
  const ms = minutes * 60 * 1000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}
