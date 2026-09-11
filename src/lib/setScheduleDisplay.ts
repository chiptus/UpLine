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

// status "tba" means time_start is a midnight placeholder, not a real time,
// so once the reveal level would expose it "TBA" stands in instead.
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
