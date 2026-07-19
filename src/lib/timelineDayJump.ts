import { fromZonedTime } from "date-fns-tz";
import type { ScheduleDay } from "@/hooks/useScheduleData";

// Clears the pinned StageLabels column (absolute, left-4, up to ~180px wide
// for long stage names) so a left-aligned day jump doesn't land a set's card
// under it. Shared by useTimelineJump (to compute the scroll target) and
// useActiveTimelineDay (to compute matching day boundaries), so the two never drift.
export const DAY_JUMP_START_GUTTER_PX = 190;

/**
 * The moment a day jump centers on: the day's earliest set start (midnight
 * is usually dead timeline), falling back to festival-timezone midnight.
 */
export function getDayJumpMoment(day: ScheduleDay, timezone: string): Date {
  let earliestSetStart: Date | null = null;

  day.stages.forEach((stage) => {
    stage.sets.forEach((set) => {
      if (
        set.startTime &&
        (!earliestSetStart || set.startTime < earliestSetStart)
      ) {
        earliestSetStart = set.startTime;
      }
    });
  });

  return earliestSetStart ?? fromZonedTime(`${day.date}T00:00:00`, timezone);
}
