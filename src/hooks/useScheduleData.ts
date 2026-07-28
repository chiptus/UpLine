import { useMemo } from "react";
import {
  formatDateTime,
  getFestivalDayKey,
  getFestivalDayLabel,
} from "@/lib/timeUtils";
import type { FestivalSet } from "@/api/sets/types";
import type { Stage } from "@/api/stages/types";
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

type EnhancedSet = ScheduleSet & { dayKey: string };

interface UseScheduleDataOptions {
  sets: FestivalSet[] | undefined;
  stages: Array<Stage> | undefined;
  use24Hour?: boolean;
  timezone?: string;
}

export function useScheduleData({
  sets,
  stages,
  use24Hour = false,
  timezone,
}: UseScheduleDataOptions) {
  const scheduleDays = useMemo(() => {
    if (!sets || !stages || !Array.isArray(sets) || sets.length === 0) {
      return [];
    }

    // Filter sets with performance times and stages, and drop any whose
    // time_start doesn't parse into a valid festival day (so dayKey is
    // always a real key below, never a sentinel).
    const performingSets = sets
      .filter((set) => set.time_start && set.stage_id)
      .flatMap((set) => {
        const dayKey = getFestivalDayKey(set.time_start, timezone);
        return dayKey ? [{ set, dayKey }] : [];
      });

    // Parse and enhance set data
    const enhancedSets: EnhancedSet[] = performingSets.map(
      ({ set, dayKey }) => {
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
          formattedTimeRange: formatDateTime(
            set.time_start,
            use24Hour,
            timezone,
          ),
          dayKey,
          artists: (set.artists || []).map((artist) => ({
            id: artist.id,
            name: artist.name,
          })),
        };
      },
    );

    // Group sets by festival calendar day
    const dayGroups = enhancedSets.reduce(
      (acc, set) => {
        if (!acc[set.dayKey]) {
          acc[set.dayKey] = [];
        }
        acc[set.dayKey].push(set);
        return acc;
      },
      {} as Record<string, EnhancedSet[]>,
    );

    // Convert to ScheduleDay format
    const scheduleDays: ScheduleDay[] = Object.entries(dayGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, daySets]) => {
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
          displayDate: getFestivalDayLabel(dateKey) || dateKey,
          stages: sortStagesByOrder(scheduleStages),
        };
      });

    return scheduleDays;
  }, [sets, use24Hour, stages, timezone]);

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
  };
}
