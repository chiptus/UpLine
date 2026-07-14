import { fromZonedTime } from "date-fns-tz";
import type { ScheduleDay } from "@/hooks/useScheduleData";

/**
 * The moment the timeline viewport should center on when jumping to a day
 * from the day-jump toolbar: the day's earliest set start, since that's what
 * a viewer actually wants centered (the day's midnight is usually a stretch
 * of dead timeline with nothing scheduled). Falls back to festival-timezone
 * midnight for a day with no timed sets yet.
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
