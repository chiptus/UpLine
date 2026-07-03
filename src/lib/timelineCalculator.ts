import { differenceInMinutes } from "date-fns";
import type { ScheduleSet, ScheduleDay } from "@/hooks/useScheduleData";
import type { Stage } from "@/api/stages/types";
import { sortStagesByOrder } from "@/lib/stageUtils";

export interface HorizontalTimelineSet extends ScheduleSet {
  horizontalPosition?: {
    left: number;
    width: number;
  };
}

export interface TimelineData {
  timeSlots: Date[];
  stages: Array<{
    name: string;
    color?: string;
    sets: HorizontalTimelineSet[];
  }>;
  totalWidth: number;
  festivalStart: Date;
  festivalEnd: Date;
}

export function calculateTimelineData(
  festivalStartDate: Date,
  festivalEndDate: Date,
  scheduleDays: ScheduleDay[],
  stages: Stage[],
): TimelineData | null {
  if (!scheduleDays || scheduleDays.length === 0) {
    return null;
  }

  if (!festivalStartDate || !festivalEndDate) {
    return null;
  }

  const { earliestTime, latestTime, totalHours } = calculateTimeBoundaries(
    festivalStartDate,
    festivalEndDate,
    scheduleDays,
  );

  const timeSlots = generateTimeSlots(earliestTime, totalHours);

  const unifiedStages = processStageGroups(
    scheduleDays,
    stages,
    earliestTime,
    (
      set: ScheduleSet,
      startMinutes: number,
      duration: number,
    ): HorizontalTimelineSet => {
      if (!set.startTime || !set.endTime) return set;

      const left = startMinutes * 2;
      const width = Math.max(duration * 2, 100);

      return {
        ...set,
        horizontalPosition: {
          left,
          width,
        },
      };
    },
  );

  return {
    timeSlots,
    stages: unifiedStages,
    totalWidth: totalHours * 120,
    festivalStart: earliestTime,
    festivalEnd: latestTime,
  };
}

function calculateEarliestSetTime(scheduleDays: ScheduleDay[]) {
  let earliestSetTime: Date | null = null;

  scheduleDays.forEach((day) => {
    day.stages.forEach((stage) => {
      stage.sets.forEach((artist) => {
        if (artist.startTime) {
          if (!earliestSetTime || artist.startTime < earliestSetTime) {
            earliestSetTime = artist.startTime;
          }
        }
      });
    });
  });
  if (!earliestSetTime) {
    return null;
  }

  const earliestTime = new Date(earliestSetTime);
  earliestTime.setMinutes(0, 0, 0);

  return earliestTime;
}

function calculateLatestSetTime(scheduleDays: ScheduleDay[]) {
  let latestSetTime: Date | null = null;

  scheduleDays.forEach((day) => {
    day.stages.forEach((stage) => {
      stage.sets.forEach((artist) => {
        if (artist.endTime) {
          if (!latestSetTime || artist.endTime > latestSetTime) {
            latestSetTime = artist.endTime;
          }
        }
      });
    });
  });
  if (!latestSetTime) {
    return null;
  }

  const latestTime = new Date(latestSetTime);
  latestTime.setMinutes(59, 59, 999);

  return latestTime;
}

interface TimeBoundaries {
  earliestTime: Date;
  latestTime: Date;
  totalHours: number;
}

function calculateTimeBoundaries(
  festivalStartDate: Date,
  festivalEndDate: Date,
  scheduleDays: ScheduleDay[],
): TimeBoundaries {
  const earliestSetTime = calculateEarliestSetTime(scheduleDays);
  const earliestTime = earliestSetTime || new Date(festivalStartDate);

  const latestSetTime = calculateLatestSetTime(scheduleDays);
  const latestTime = latestSetTime || new Date(festivalEndDate);

  const totalMinutes = differenceInMinutes(latestTime, earliestTime);
  const totalHours = Math.ceil(totalMinutes / 60);

  return { earliestTime, latestTime, totalHours };
}

function generateTimeSlots(earliestTime: Date, totalHours: number): Date[] {
  const timeSlots = [];
  for (let i = 0; i <= totalHours; i++) {
    const timeSlot = new Date(earliestTime.getTime() + i * 60 * 60 * 1000);
    timeSlots.push(timeSlot);
  }
  return timeSlots;
}

function processStageGroups<T extends ScheduleSet>(
  scheduleDays: ScheduleDay[],
  stages: Stage[],
  earliestTime: Date,
  positionCalculator: (
    set: ScheduleSet,
    startMinutes: number,
    duration: number,
  ) => T,
): Array<{
  name: string;
  color: string | undefined;
  stage_order: number;
  sets: T[];
}> {
  const allStageGroups: Record<string, T[]> = {};

  scheduleDays.forEach((day) => {
    day.stages.forEach((stage) => {
      if (!allStageGroups[stage.id]) {
        allStageGroups[stage.id] = [];
      }

      const enhancedSets = stage.sets.map((set): T => {
        if (!set.startTime || !set.endTime)
          return positionCalculator(set, 0, 0);

        const startMinutes = differenceInMinutes(set.startTime, earliestTime);
        const duration = differenceInMinutes(set.endTime, set.startTime);

        return positionCalculator(set, startMinutes, duration);
      });

      allStageGroups[stage.id].push(...enhancedSets);
    });
  });

  const unifiedStagesUnsorted = Object.entries(allStageGroups)
    .map(([stageId, sets]) => {
      const stage = stages.find((s) => s.id === stageId);
      if (!stage) {
        return null;
      }

      return {
        name: stage.name,
        color: stage.color || undefined,
        stage_order: stage.stage_order || 0,
        sets: sets.sort((a, b) => {
          if (!a.startTime || !b.startTime) return 0;
          return a.startTime.getTime() - b.startTime.getTime();
        }),
      };
    })
    .filter(
      (
        s,
      ): s is {
        name: string;
        color: string | undefined;
        stage_order: number;
        sets: T[];
      } => !!s,
    );

  return sortStagesByOrder(unifiedStagesUnsorted);
}
