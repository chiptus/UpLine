import { VOTES_TYPES, VOTE_CONFIG, VoteType, getVoteConfig } from "./config";

export interface VoteTally {
  counts: Record<VoteType, number>;
  score: number;
}

export function tallyVotes(
  votes: Array<{ vote_type: number }> | null | undefined,
): VoteTally {
  const counts = Object.fromEntries(
    VOTES_TYPES.map((voteType) => [voteType, 0]),
  ) as Record<VoteType, number>;

  for (const vote of votes || []) {
    const voteType = getVoteConfig(vote.vote_type);
    if (voteType) {
      counts[voteType] += 1;
    }
  }

  const score = VOTES_TYPES.reduce(
    (sum, voteType) => sum + counts[voteType] * VOTE_CONFIG[voteType].value,
    0,
  );

  return { counts, score };
}
