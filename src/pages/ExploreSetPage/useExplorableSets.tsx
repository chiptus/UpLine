import { useSetsByEditionQuery } from "@/api/sets/useSetsByEdition";
import { useEffect, useState } from "react";
import type { FestivalSet } from "@/api/sets/types";

type Queue = { editionId: string | undefined; sets: FestivalSet[] };

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
  const allSets = setsQuery.data || [];

  // The queue is locked in once loaded, using the votes as they stood at
  // that point. Voting on the current set during the session no longer
  // removes it (which used to shift `currentIndex` onto the next set,
  // making a vote look like a skip) — only skipping does.
  const [queue, setQueue] = useState<Queue | null>(null);

  useEffect(() => {
    if (allSets.length === 0 || !votesReady) return;

    setQueue((prev) => {
      if (prev?.editionId === editionId) return prev;

      const validSets = allSets.filter(
        (set) => hasExplorableData(set) && !userVotes[set.id],
      );
      return { editionId, sets: shuffle(validSets) };
    });
    // userVotes is deliberately excluded: the queue should only be rebuilt
    // when the edition or underlying set list changes, not on every vote.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSets, votesReady, editionId]);

  const queueIsCurrent = queue !== null && queue.editionId === editionId;
  const explorableSets = queueIsCurrent ? queue.sets : [];

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
    isLoading: setsQuery.isLoading || (allSets.length > 0 && !queueIsCurrent),
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
