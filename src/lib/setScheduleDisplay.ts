import { formatDayOnly, formatTimeRange } from "@/lib/timeUtils";

type SetScheduleFields = {
  time_start: string | null;
  time_end: string | null;
  time_tba: boolean;
};

type ScheduleRevealFlags = {
  canShowDay: boolean;
  canShowTime: boolean;
};

// time_tba means time_start is a midnight placeholder, not a real time, so
// once the reveal level would expose it "TBA" stands in instead (#45).
export function formatSetSchedule(
  set: SetScheduleFields,
  reveal: ScheduleRevealFlags,
  use24Hour: boolean,
  timezone?: string,
): string | null {
  if (reveal.canShowTime && !set.time_tba) {
    return formatTimeRange(set.time_start, set.time_end, use24Hour, timezone);
  }
  if (!reveal.canShowDay) return null;
  const day = formatDayOnly(set.time_start, timezone);
  if (!day) return null;
  return set.time_tba ? `${day} · TBA` : day;
}
