import { useSetsByEditionQuery } from "@/api/sets/useSetsByEdition";
import { useRef } from "react";
import type { FestivalSet } from "@/api/sets/types";

const EMPTY_SETS: FestivalSet[] = [];

export function useExplorableSets({
  editionId,
  userVotes,
  votesReady,
}: {
  editionId?: string | undefined;
  userVotes: Record<string, number>;
  votesReady: boolean;
}) {
  const setsQuery = useSetsByEditionQuery(editionId);
  const allSets = setsQuery.data ?? EMPTY_SETS;

  // Locked in once loaded; the caller remounts this hook (via a key on
  // edition/user) whenever which votes apply should actually change.
  const queueRef = useRef<FestivalSet[] | null>(null);

  if (queueRef.current === null && allSets.length > 0 && votesReady) {
    const validSets = allSets.filter(
      (set) => hasExplorableData(set) && !userVotes[set.id],
    );
    queueRef.current = shuffle(validSets);
  }

  const explorableSets = queueRef.current ?? [];

  let votedCount = 0;
  let nonExplorableCount = 0;
  for (const set of allSets) {
    if (userVotes[set.id]) {
      votedCount++;
    } else if (!hasExplorableData(set)) {
      nonExplorableCount++;
    }
  }

  return {
    data: explorableSets,
    isLoading:
      setsQuery.isLoading || (allSets.length > 0 && queueRef.current === null),
    error: setsQuery.error,
    totalSets: allSets.length,
    votedCount,
    nonExplorableCount,
  };
}

function hasExplorableData(set: FestivalSet): boolean {
  return Boolean(
    set.artists &&
      set.artists.length > 0 &&
      set.name &&
      set.artists[0].soundcloud_url,
  );
}

/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * @param array The array to shuffle
 * @returns A new array with the elements shuffled
 */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
