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
  // First get group member user IDs
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

  // Then get votes from those users for this set
  const { data: votes, error: votesError } = await supabase
    .from("votes")
    .select("vote_type, user_id")
    .eq("set_id", setId)
    .in("user_id", memberIds);

  if (votesError) {
    throw new Error("Failed to fetch group votes");
  }

  if (!votes || votes.length === 0) {
    return [];
  }

  // Finally get usernames for the voters
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username")
    .in(
      "id",
      votes.map((vote) => vote.user_id),
    );

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
  }

  return votes.map((vote) => {
    const profile = profiles?.find((p) => p.id === vote.user_id);
    return {
      vote_type: vote.vote_type,
      user_id: vote.user_id,
      username: profile?.username || null,
    };
  });
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
