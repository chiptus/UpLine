import { formatDayOnly, formatTimeRange } from "@/lib/timeUtils";

type SetScheduleFields = {
  time_start: string | null;
  time_end: string | null;
  status: string;
};

type ScheduleRevealFlags = {
  canShowDay: boolean;
  canShowTime: boolean;
};

// status "tba" means time_start is a midnight placeholder, not a real time,
// so once the reveal level would expose it "TBA" stands in instead (#45).
export function formatSetSchedule(
  set: SetScheduleFields,
  reveal: ScheduleRevealFlags,
  use24Hour: boolean,
  timezone?: string,
): string | null {
  const isTba = set.status === "tba";
  if (reveal.canShowTime && !isTba) {
    return formatTimeRange(set.time_start, set.time_end, use24Hour, timezone);
  }
  if (!reveal.canShowDay) return null;
  const day = formatDayOnly(set.time_start, timezone);
  // A dateless TBA set (no time_start at all) has no day to show -- say so
  // plainly instead of silently showing nothing (#45).
  if (!day) return isTba ? "Time TBA" : null;
  return isTba ? `${day} · TBA` : day;
}
