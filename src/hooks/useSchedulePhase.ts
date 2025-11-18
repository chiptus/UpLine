import { useMemo } from "react";

export type SchedulePhase = "pre-schedule" | "post-schedule";

export interface SchedulePhaseInfo {
  phase: SchedulePhase;
  hasSchedule: boolean;
  scheduledCount: number;
  totalCount: number;
  scheduleProgress: number;
}

interface SetWithSchedule {
  time_start?: string | null;
  stage_id?: string | null;
}

export function useSchedulePhase<T extends SetWithSchedule>(
  sets: T[] | undefined
): SchedulePhaseInfo {
  return useMemo(() => {
    if (!sets || sets.length === 0) {
      return {
        phase: "pre-schedule",
        hasSchedule: false,
        scheduledCount: 0,
        totalCount: 0,
        scheduleProgress: 0,
      };
    }

    const scheduledCount = sets.filter(
      (set) => set.time_start && set.stage_id
    ).length;
    const totalCount = sets.length;
    const hasSchedule = scheduledCount > 0;
    const scheduleProgress = totalCount > 0 ? scheduledCount / totalCount : 0;

    const phase: SchedulePhase = hasSchedule ? "post-schedule" : "pre-schedule";

    return {
      phase,
      hasSchedule,
      scheduledCount,
      totalCount,
      scheduleProgress,
    };
  }, [sets]);
}

export function detectSchedulePhase<T extends SetWithSchedule>(
  sets: T[] | undefined
): SchedulePhase {
  if (!sets || sets.length === 0) return "pre-schedule";
  const hasSchedule = sets.some((set) => set.time_start && set.stage_id);
  return hasSchedule ? "post-schedule" : "pre-schedule";
}
