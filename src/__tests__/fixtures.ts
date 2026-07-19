import type { ScheduleDay, ScheduleStage } from "@/hooks/useScheduleData";
import type { Stage } from "@/api/stages/types";

export function makeScheduleDay(
  date: string,
  stages: ScheduleStage[] = [],
): ScheduleDay {
  return { date, displayDate: date, stages };
}

export function makeStage(overrides: Partial<Stage> = {}): Stage {
  return {
    id: "stage-1",
    name: "Main Stage",
    color: "#ff0000",
    stage_order: 0,
    ...overrides,
  } as unknown as Stage;
}
