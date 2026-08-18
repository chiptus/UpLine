export const VOTE_SCOPES = ["everyone", "me", "group"] as const;
export type VoteScope = (typeof VOTE_SCOPES)[number];

/** The two-state subset used by toggles that don't offer a "me" option. */
export type BinaryVoteScope = Exclude<VoteScope, "me">;

interface ScopedVote {
  user_id: string;
  vote_type: number;
}

interface ResolveVotesForScopeParams<TVote extends ScopedVote> {
  votes: TVote[];
  scope: VoteScope;
  groupMemberIds: Set<string>;
  currentUserId?: string;
}

export function resolveVotesForScope<TVote extends ScopedVote>({
  votes,
  scope,
  groupMemberIds,
  currentUserId,
}: ResolveVotesForScopeParams<TVote>): TVote[] {
  if (scope === "everyone") {
    return votes;
  }

  if (scope === "me") {
    return votes.filter((vote) => vote.user_id === currentUserId);
  }

  return votes.filter((vote) => groupMemberIds.has(vote.user_id));
}
