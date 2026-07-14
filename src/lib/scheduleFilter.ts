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
  // "all" or a festival day key (yyyy-MM-dd, see getFestivalDayKey).
  day: string;
  // Time-of-day bucket, computed in the festival timezone via getFestivalHour.
  time: ScheduleTimeFilter;
  // Stage ids to include; an empty array means all stages.
  stages: string[];
  // My-vote chips (PRD #188): selected vote types, OR-ed together. Empty or
  // omitted turns the filter off (all sets kept, `userVotes` unconsulted).
  // Always the viewer's own votes - group-vote scopes are out of scope here.
  voteTypes?: VoteType[];
  // The viewer's own votes, keyed by set id -> vote value (same shape as
  // useUserVotes' return). Passed in, never fetched inside - keeps this
  // function pure.
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

  const voteValue = userVotes?.[set.id];
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
