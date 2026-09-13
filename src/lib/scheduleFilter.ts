import { getFestivalHour } from "@/lib/timeUtils";
import type { TimelineSearch } from "@/lib/searchSchemas";
import { getVoteConfig, type VoteType } from "@/lib/voteConfig";
import { resolveVotesForScope, type VoteScope } from "@/lib/voteScope";
import { matchesSetTypeFilter } from "@/lib/setTypeFilter";
import type { SetType } from "@/api/sets/types";
import type {
  ScheduleDay,
  ScheduleSet,
  ScheduleStage,
} from "@/hooks/useScheduleData";

export type ScheduleTimeFilter = TimelineSearch["time"];

const EMPTY_MEMBER_IDS: Set<string> = new Set();

export interface ScheduleFilterCriteria {
  day: string;
  time: ScheduleTimeFilter;
  stages: string[];
  voteTypes?: VoteType[];
  /** Untyped (`null`) sets match under "other". */
  setTypes?: SetType[];
  voteScope?: VoteScope;
  /** `undefined` (logged out) makes vote filtering inert, not exclusionary. */
  currentUserId?: string | undefined;
  /** `undefined` (group members still loading, or no group) makes group-scope vote filtering inert. */
  groupMemberIds?: Set<string> | undefined;
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
  voteScope: VoteScope | undefined,
  currentUserId: string | undefined,
  groupMemberIds: Set<string> | undefined,
): boolean {
  if (!voteTypes || voteTypes.length === 0) return true;
  if (currentUserId === undefined) return true;
  if (voteScope === "group" && groupMemberIds === undefined) return true;

  const scopedVotes = resolveVotesForScope({
    votes: set.votes || [],
    scope: voteScope ?? "me",
    groupMemberIds: groupMemberIds ?? EMPTY_MEMBER_IDS,
    currentUserId,
  });

  return scopedVotes.some((vote) => {
    const voteType = getVoteConfig(vote.vote_type);
    return voteType !== undefined && voteTypes.includes(voteType);
  });
}

/**
 * Applies the day / time-of-day / stage / set-type / vote predicates shared by both
 * Schedule views. Non-matching days are kept with empty stages, not dropped.
 */
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
            matchesSetTypeFilter(set.setType, criteria.setTypes ?? []) &&
            matchesVoteTypes(
              set,
              criteria.voteTypes,
              criteria.voteScope,
              criteria.currentUserId,
              criteria.groupMemberIds,
            ),
        ),
      }));

    return { ...day, stages: filteredStages };
  });
}
