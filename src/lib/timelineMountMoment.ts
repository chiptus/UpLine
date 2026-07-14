import { isValid, parseISO } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

export interface TimelineMountMomentInput {
  /** Raw `scrollTo` search param, if present in the URL. */
  scrollTo?: string;
  /** Active day filter: "all" or a "yyyy-MM-dd" festival calendar day. */
  day: string;
  /** Festival's IANA timezone, used to resolve the day filter's start. */
  timezone: string;
  /**
   * Timeline geometry origin (earliest moment on the timeline) - also the
   * start of the "festival window" the now-rule checks against, see
   * `isNowWithinFestivalWindow`.
   */
  festivalStart: Date;
  /** End of the rendered timeline strip - the window's other bound. */
  festivalEnd: Date;
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
 *   3. Now minus ~1h of context, if `now` falls inside the festival window.
 *   4. The festival start (timeline origin), as the final fallback.
 */
export function resolveTimelineMountMoment(
  input: TimelineMountMomentInput,
): Date {
  return (
    momentFromScrollTo(input.scrollTo) ??
    momentFromDayFilter(input.day, input.timezone) ??
    momentFromNow(input.now, input.festivalStart, input.festivalEnd) ??
    input.festivalStart
  );
}

/**
 * Whether `now` falls inside the festival window - the rendered timeline's
 * own `festivalStart`/`festivalEnd` bounds (from `TimelineData`), not the
 * edition's raw `start_date`/`end_date`. Those bounds already fold in the
 * actual earliest/latest set times, so a moment inside this window is
 * guaranteed to land on the rendered strip when converted via
 * `timeToOffset` - the edition's calendar dates alone (parsed at UTC
 * midnight) would risk the last festival day's evening sets reading as
 * "outside the window". Inclusive of both ends.
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
  festivalStart: Date,
  festivalEnd: Date,
): Date | null {
  if (!isNowWithinFestivalWindow(now, festivalStart, festivalEnd)) return null;
  return new Date(now.getTime() - NOW_CONTEXT_MS);
}

/**
 * Rounds a moment to the nearest multiple of `minutes` (default 5), used to
 * keep `scrollTo` URL writes coarse-grained instead of pixel-precise.
 */
export function roundToNearestMinutes(date: Date, minutes = 5): Date {
  const ms = minutes * 60 * 1000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}
