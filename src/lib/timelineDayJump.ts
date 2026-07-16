import { fromZonedTime } from "date-fns-tz";
import type { ScheduleDay } from "@/hooks/useScheduleData";

// The moment a day jump centers on: the day's earliest set start (midnight is
// usually dead timeline), falling back to festival-timezone midnight.
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
