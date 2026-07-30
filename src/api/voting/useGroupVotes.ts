import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { groupVotesKeys } from "./types";

export interface GroupVote {
  vote_type: number;
  user_id: string;
  username: string | null;
}

async function fetchGroupVotes(
  setId: string,
  groupId: string,
): Promise<GroupVote[]> {
  const { data: groupMembers, error: membersError } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);

  if (membersError) {
    throw new Error("Failed to fetch group members");
  }

  if (!groupMembers || groupMembers.length === 0) {
    return [];
  }

  const memberIds = groupMembers.map((member) => member.user_id);

  const { data: votes, error: votesError } = await supabase
    .from("votes")
    .select("vote_type, user_id, profiles(username)")
    .eq("set_id", setId)
    .in("user_id", memberIds);

  if (votesError) {
    throw new Error("Failed to fetch group votes");
  }

  if (!votes) {
    return [];
  }

  return votes.map((vote) => ({
    vote_type: vote.vote_type,
    user_id: vote.user_id,
    username: vote.profiles?.username || null,
  }));
}

export function groupVotesQuery(setId: string, groupId: string) {
  return queryOptions({
    queryKey: groupVotesKeys.votes(setId, groupId),
    queryFn: () => fetchGroupVotes(setId, groupId),
  });
}

export function useGroupVotesQuery(setId: string, groupId: string) {
  return useQuery({
    ...groupVotesQuery(setId, groupId),
    enabled: !!setId && !!groupId,
  });
}
