import { getFestivalHour } from "@/lib/timeUtils";
import type { TimelineSearch } from "@/lib/searchSchemas";
import type {
  ScheduleDay,
  ScheduleSet,
  ScheduleStage,
} from "@/hooks/useScheduleData";

export type ScheduleTimeFilter = TimelineSearch["time"];

export interface ScheduleFilterCriteria {
  // "all" or a festival day key (yyyy-MM-dd, see getFestivalDayKey).
  day: string;
  // Time-of-day bucket, computed in the festival timezone via getFestivalHour.
  time: ScheduleTimeFilter;
  // Stage ids to include; an empty array means all stages.
  stages: string[];
  // Future (PRD #188 - vote-type filtering): an optional field such as
  // `voteTypes?: VoteType[]`, OR-ed against the viewer's own votes on each
  // set, will slot in here without reshaping this interface.
}

function matchesTimeOfDay(
  set: ScheduleSet,
  time: ScheduleTimeFilter,
  timezone: string,
): boolean {
  if (time === "all" || !set.startTime) return true;

  const hour = getFestivalHour(set.startTime.toISOString(), timezone);
  if (hour === null) return false;

  switch (time) {
    case "morning":
      return hour >= 6 && hour < 12;
    case "afternoon":
      return hour >= 12 && hour < 18;
    case "evening":
      return hour >= 18 && hour < 24;
    default:
      return true;
  }
}

// Applies the day / time-of-day / stage predicates shared by both Schedule
// views (Timeline and List). A day that doesn't match `criteria.day` is kept
// as an entry with empty stages (rather than dropped), matching the
// Timeline's day-strip layout, which needs every day present even when empty.
export function filterScheduleDays(
  scheduleDays: ScheduleDay[],
  criteria: ScheduleFilterCriteria,
  timezone: string,
): ScheduleDay[] {
  return scheduleDays.map((day) => {
    if (criteria.day !== "all" && day.date !== criteria.day) {
      return { ...day, stages: [] };
    }

    const filteredStages: ScheduleStage[] = day.stages
      .filter(
        (stage) =>
          criteria.stages.length === 0 || criteria.stages.includes(stage.id),
      )
      .map((stage) => ({
        ...stage,
        sets: stage.sets.filter((set) =>
          matchesTimeOfDay(set, criteria.time, timezone),
        ),
      }));

    return { ...day, stages: filteredStages };
  });
}
