import { useMemo } from "react";
import {
  detectAllConflicts,
  getConflictingSetsForUser,
  hasConflicts,
  getConflictCount,
} from "@/lib/scheduleConflicts";

interface SetWithTime {
  id: string;
  time_start: string | null;
  time_end: string | null;
  stage_id?: string | null;
}

export function useSetConflicts<T extends SetWithTime>(
  sets: T[] | undefined,
  userVotedSetIds?: string[]
) {
  const allConflicts = useMemo(() => {
    if (!sets) return new Map<string, string[]>();
    return detectAllConflicts(sets);
  }, [sets]);

  const userConflicts = useMemo(() => {
    if (!sets || !userVotedSetIds || userVotedSetIds.length === 0) {
      return new Map<string, T[]>();
    }

    const userVotedSets = sets.filter((set) =>
      userVotedSetIds.includes(set.id)
    );
    return getConflictingSetsForUser(userVotedSets, sets);
  }, [sets, userVotedSetIds]);

  const hasUserConflicts = userConflicts.size > 0;

  const userConflictCount = useMemo(() => {
    let count = 0;
    userConflicts.forEach((conflictingSets) => {
      count += conflictingSets.length;
    });
    return count;
  }, [userConflicts]);

  return {
    allConflicts,
    userConflicts,
    hasUserConflicts,
    userConflictCount,
    hasConflict: (setId: string) => hasConflicts(setId, allConflicts),
    getConflictCount: (setId: string) => getConflictCount(setId, allConflicts),
  };
}
