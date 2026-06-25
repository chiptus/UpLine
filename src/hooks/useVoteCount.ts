import { useCallback, useMemo } from "react";
import { FestivalSet } from "@/api/sets/types";

export function useVoteCount(set: FestivalSet | undefined) {
  const voteCounts = useMemo(() => {
    if (!set?.votes) {
      return {};
    }

    const counts: Record<number, number> = {};
    for (const vc of set.votes) {
      counts[vc.vote_type] = (counts[vc.vote_type] || 0) + 1;
    }
    return counts;
  }, [set?.votes]);

  const getVoteCount = useCallback(
    (voteType: number) => voteCounts[voteType] || 0,
    [voteCounts],
  );

  return { getVoteCount };
}
