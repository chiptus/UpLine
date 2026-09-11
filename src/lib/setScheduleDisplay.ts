import { formatDayOnly, formatTimeRange } from "@/lib/timeUtils";
import {
  canShowDay,
  canShowTime,
  type RevealLevel,
} from "@/lib/scheduleReveal";

type SetScheduleFields = {
  time_start: string | null;
  time_end: string | null;
  status: string;
};

/**
 * Formats a set's schedule info for display, respecting both the edition's
 * schedule reveal level and the set's TBA status. Returns the exact time
 * range, a day-only label, a "TBA" variant of either, or null if nothing
 * should be shown yet at the current reveal level.
 */
export function formatSetSchedule(
  set: SetScheduleFields,
  revealLevel: RevealLevel,
  use24Hour: boolean,
  timezone?: string,
): string | null {
  const isTba = set.status === "tba";
  if (canShowTime(revealLevel) && !isTba) {
    return formatTimeRange(set.time_start, set.time_end, use24Hour, timezone);
  }
  if (!canShowDay(revealLevel)) return null;
  const day = formatDayOnly(set.time_start, timezone);
  // A dateless TBA set (no time_start at all) has no day to show -- say so
  // plainly instead of silently showing nothing.
  if (!day) return isTba ? "Time TBA" : null;
  return isTba ? `${day} · TBA` : day;
}
