import { useMemo } from "react";
import { formatDateTime } from "@/lib/timeUtils";
import { format, startOfDay } from "date-fns";
import type { FestivalSet } from "@/api/sets/types";
import { Stage } from "./queries/stages/types";
import { sortStagesByOrder } from "@/lib/stageUtils";

export interface ScheduleDay {
  date: string;
  displayDate: string;
  stages: ScheduleStage[];
}

export interface ScheduleStage {
  id: string;
  name: string;
  stage_order: number;
  sets: ScheduleSet[];
}

export interface ScheduleArtist {
  id: string;
  name: string;
  slug?: string;
  stageId?: string;
  startTime?: Date;
  endTime?: Date;
  votes?: { vote_type: number; user_id: string }[];
  formattedTimeRange?: string | null;
  conflictsWith?: string[];
  position?: {
    top: number;
    height: number;
  };
}

// Schedule Set type for the new system
export interface ScheduleSet extends ScheduleArtist {
  artists: ScheduleArtist[];
}

export function useScheduleData(
  sets: FestivalSet[] | undefined,
  stages: Array<Stage> | undefined,
  use24Hour: boolean = false,
) {
  const loading = false;
  const error = null;

  const scheduleDays = useMemo(() => {
    if (!sets || !stages || !Array.isArray(sets) || sets.length === 0) {
      return [];
    }

    // Filter sets with performance times and stages
    const performingSets = sets.filter((set) => set.time_start && set.stage_id);

    // Parse and enhance set data
    const enhancedSets: ScheduleSet[] = performingSets.map((set) => {
      const startTime = set.time_start ? new Date(set.time_start) : undefined;
      const endTime = set.time_end ? new Date(set.time_end) : undefined;

      return {
        id: set.id,
        name: set.name,
        slug: set.slug,
        stageId: set.stage_id || "",
        startTime,
        endTime,
        votes: set.votes || [],
        formattedTimeRange: formatDateTime(set.time_start, use24Hour),
        artists: (set.artists || []).map((artist) => ({
          id: artist.id,
          name: artist.name,
        })),
      };
    });

    // Group sets by day
    const dayGroups = enhancedSets.reduce(
      (acc, set) => {
        if (!set.startTime) return acc;

        const dayKey = format(startOfDay(set.startTime), "yyyy-MM-dd");
        if (!acc[dayKey]) {
          acc[dayKey] = [];
        }
        acc[dayKey].push(set);
        return acc;
      },
      {} as Record<string, ScheduleSet[]>,
    );

    // Convert to ScheduleDay format
    const scheduleDays: ScheduleDay[] = Object.entries(dayGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, daySets]) => {
        const date = new Date(dateKey);

        // Group by stage
        const stageGroups = daySets.reduce(
          (acc, set) => {
            const stageId = set.stageId;
            if (!stageId) {
              console.log("no stageId", set);
              return acc;
            }

            if (!acc[stageId]) {
              acc[stageId] = [];
            }

            acc[stageId].push(set);
            return acc;
          },
          {} as Record<string, ScheduleSet[]>,
        );

        // Sort sets within each stage by time
        const scheduleStages: ScheduleStage[] = Object.entries(stageGroups)
          .map(([stageId, stageSets]) => {
            const stage = stages.find((s) => s.id === stageId);
            if (!stage) {
              return null;
            }

            return {
              id: stageId,
              name: stage?.name,
              stage_order: stage?.stage_order,
              sets: stageSets.sort((a, b) => {
                if (!a.startTime || !b.startTime) return 0;
                return a.startTime.getTime() - b.startTime.getTime();
              }),
            } satisfies ScheduleStage;
          })
          .filter((v: ScheduleStage | null): v is ScheduleStage => !!v);

        return {
          date: dateKey,
          displayDate: format(date, "EEEE, MMM d"),
          stages: sortStagesByOrder(scheduleStages),
        };
      });

    return scheduleDays;
  }, [sets, use24Hour, stages]);

  const allStages = useMemo(() => {
    const stageSet = new Set<string>();
    scheduleDays.forEach((day) => {
      day.stages.forEach((stage) => {
        stageSet.add(stage.name);
      });
    });
    return Array.from(stageSet).sort();
  }, [scheduleDays]);

  return {
    scheduleDays,
    allStages,
    loading,
    error,
  };
}
