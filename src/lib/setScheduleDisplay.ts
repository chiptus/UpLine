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
  if (!day) return null;
  return isTba ? `${day} · TBA` : day;
}

// A shared time slot (all sets sorted onto the same midnight placeholder)
// only reads as "TBA" when every set in it is TBA -- a mix with a real set
// that happens to start at 00:00 must show the real time instead (#45).
export function isTimeSlotTba(sets: { timeTba?: boolean }[]): boolean {
  return sets.length > 0 && sets.every((set) => set.timeTba);
}
