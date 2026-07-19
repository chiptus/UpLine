import type { ScheduleDay, ScheduleStage } from "@/hooks/useScheduleData";

export function makeScheduleDay(
  date: string,
  stages: ScheduleStage[] = [],
): ScheduleDay {
  return { date, displayDate: date, stages };
}
