import { useSetsByEditionQuery } from "@/api/sets/useSetsByEdition";
import { useMemo } from "react";

export function useExplorableSets({
  editionId,
  userVotes,
}: {
  editionId?: string | undefined;
  userVotes: Record<string, number>;
}) {
  const setsQuery = useSetsByEditionQuery(editionId);

  const stats = useMemo(() => {
    const allSets = setsQuery.data || [];
    const totalSets = allSets.length;

    let votedCount = 0;
    let nonExplorableCount = 0;
    const validSets: typeof allSets = [];

    for (const set of allSets) {
      const hasValidData =
        set.artists &&
        set.artists.length > 0 &&
        set.name &&
        set.artists[0].soundcloud_url;

      if (userVotes[set.id]) {
        votedCount++;
      } else if (!hasValidData) {
        nonExplorableCount++;
      } else {
        validSets.push(set);
      }
    }

    return {
      explorableSets: shuffle(validSets),
      totalSets,
      votedCount,
      nonExplorableCount,
    };
  }, [setsQuery.data, userVotes]);

  return {
    data: stats.explorableSets,
    isLoading: setsQuery.isLoading,
    error: setsQuery.error,
    totalSets: stats.totalSets,
    votedCount: stats.votedCount,
    nonExplorableCount: stats.nonExplorableCount,
  };
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
