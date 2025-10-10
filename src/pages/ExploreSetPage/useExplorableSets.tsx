import { useSetsByEditionQuery } from "@/hooks/queries/sets/useSetsByEdition";
import { useMemo } from "react";

export function useExplorableSets({
  editionId,
  userVotes,
}: {
  editionId?: string;
  userVotes: Record<string, number>;
}) {
  const setsQuery = useSetsByEditionQuery(editionId);

  // Filter to sets with artists and valid data, excluding already voted sets
  const explorableSets = useMemo(() => {
    const validSets =
      setsQuery.data?.filter(
        (set) =>
          set.artists &&
          set.artists.length > 0 &&
          set.name &&
          set.artists[0].soundcloud_url &&
          !userVotes[set.id],
      ) || [];

    // Randomize the order using Fisher-Yates shuffle
    return shuffle(validSets);
  }, [setsQuery.data, userVotes]);

  return {
    data: explorableSets,
    isLoading: setsQuery.isLoading,
    error: setsQuery.error,
    totalSets: setsQuery.data?.length || 0,
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
