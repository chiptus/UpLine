import { isValid, parseISO } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

export interface TimelineMountMomentInput {
  /** Raw `scrollTo` search param, if present in the URL. */
  scrollTo?: string;
  /** Active day filter: "all" or a "yyyy-MM-dd" festival calendar day. */
  day: string;
  /** Festival's IANA timezone, used to resolve the day filter's start. */
  timezone: string;
  /** Timeline geometry origin (earliest moment on the timeline). */
  festivalStart: Date;
}

/**
 * Decides which moment the timeline viewport should be centered on when the
 * Timeline mounts. Pure and order-sensitive:
 *
 *   1. `scrollTo` from the URL, if present and parseable.
 *   2. The start of the active `day` filter, if one is set.
 *   3. The festival start (timeline origin).
 *
 * A future rule ("now, minus 1h, when now falls inside the festival window")
 * slots in as an additional candidate between the day filter and the
 * festival-start fallback (see issue #194).
 */
export function resolveTimelineMountMoment(
  input: TimelineMountMomentInput,
): Date {
  return (
    momentFromScrollTo(input.scrollTo) ??
    momentFromDayFilter(input.day, input.timezone) ??
    input.festivalStart
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

/**
 * Rounds a moment to the nearest multiple of `minutes` (default 5), used to
 * keep `scrollTo` URL writes coarse-grained instead of pixel-precise.
 */
export function roundToNearestMinutes(date: Date, minutes = 5): Date {
  const ms = minutes * 60 * 1000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}
