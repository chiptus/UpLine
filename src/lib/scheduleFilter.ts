import { getFestivalHour } from "@/lib/timeUtils";
import type { TimelineSearch } from "@/lib/searchSchemas";
import { getVoteConfig, type VoteType } from "@/lib/voteConfig";
import type {
  ScheduleDay,
  ScheduleSet,
  ScheduleStage,
} from "@/hooks/useScheduleData";

export type ScheduleTimeFilter = TimelineSearch["time"];

export interface ScheduleFilterCriteria {
  day: string;
  time: ScheduleTimeFilter;
  stages: string[];
  voteTypes?: VoteType[];
  // `undefined` means no viewer identity (logged out): vote filtering is
  // inert so a shared `?votes=` link never dead-ends a logged-out visitor.
  userVotes?: Record<string, number>;
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

function matchesVoteTypes(
  set: ScheduleSet,
  voteTypes: VoteType[] | undefined,
  userVotes: Record<string, number> | undefined,
): boolean {
  if (!voteTypes || voteTypes.length === 0) return true;
  if (userVotes === undefined) return true;

  const voteValue = userVotes[set.id];
  if (voteValue === undefined) return false;

  const voteType = getVoteConfig(voteValue);
  return voteType !== undefined && voteTypes.includes(voteType);
}

// Applies the day / time-of-day / stage predicates shared by both Schedule
// views (Timeline and List). A day that doesn't match `criteria.day` is kept
// as an entry with empty stages (rather than dropped) purely to mirror the
// original inline Timeline logic; the strip's axis bounds derive from the
// remaining sets' times, so an empty day entry contributes nothing and
// dropping it would render identically.
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
        sets: stage.sets.filter(
          (set) =>
            matchesTimeOfDay(set, criteria.time, timezone) &&
            matchesVoteTypes(set, criteria.voteTypes, criteria.userVotes),
        ),
      }));

    return { ...day, stages: filteredStages };
  });
}
