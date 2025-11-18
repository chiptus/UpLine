interface SetWithTime {
  id: string;
  time_start: string | null;
  time_end: string | null;
  stage_id?: string | null;
}

export interface SetConflict {
  setId: string;
  conflictingSetIds: string[];
  timeOverlap: {
    start: Date;
    end: Date;
  };
}

export function detectTimeOverlap(
  set1: SetWithTime,
  set2: SetWithTime
): boolean {
  if (
    !set1.time_start ||
    !set1.time_end ||
    !set2.time_start ||
    !set2.time_end
  ) {
    return false;
  }

  const start1 = new Date(set1.time_start);
  const end1 = new Date(set1.time_end);
  const start2 = new Date(set2.time_start);
  const end2 = new Date(set2.time_end);

  return start1 < end2 && start2 < end1;
}

export function findConflictingSets(
  targetSet: SetWithTime,
  allSets: SetWithTime[]
): string[] {
  if (!targetSet.time_start || !targetSet.time_end) {
    return [];
  }

  return allSets
    .filter((set) => set.id !== targetSet.id)
    .filter((set) => detectTimeOverlap(targetSet, set))
    .map((set) => set.id);
}

export function detectAllConflicts(sets: SetWithTime[]): Map<string, string[]> {
  const conflicts = new Map<string, string[]>();

  sets.forEach((set) => {
    const conflictingIds = findConflictingSets(set, sets);
    if (conflictingIds.length > 0) {
      conflicts.set(set.id, conflictingIds);
    }
  });

  return conflicts;
}

export function getConflictingSetsForUser<T extends SetWithTime>(
  userVotedSets: T[],
  allSets: T[]
): Map<string, T[]> {
  const conflicts = new Map<string, T[]>();

  userVotedSets.forEach((votedSet) => {
    const conflictingSetIds = findConflictingSets(votedSet, allSets);

    const conflictingSetsData = conflictingSetIds
      .map((id) => allSets.find((s) => s.id === id))
      .filter((s): s is T => s !== undefined);

    const userVotedConflicts = conflictingSetsData.filter((conflictSet) =>
      userVotedSets.some((voted) => voted.id === conflictSet.id)
    );

    if (userVotedConflicts.length > 0) {
      conflicts.set(votedSet.id, userVotedConflicts);
    }
  });

  return conflicts;
}

export function hasConflicts(
  setId: string,
  conflicts: Map<string, string[]>
): boolean {
  return conflicts.has(setId) && (conflicts.get(setId)?.length ?? 0) > 0;
}

export function getConflictCount(
  setId: string,
  conflicts: Map<string, string[]>
): number {
  return conflicts.get(setId)?.length ?? 0;
}
