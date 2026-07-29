import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { userVotesKeys } from "./types";

async function fetchUserVotes(userId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("votes")
    .select("set_id, vote_type")
    .eq("user_id", userId);

  if (error) {
    throw new Error("Failed to fetch user votes");
  }

  const votes: Record<string, number> = {};

  (data || []).forEach((vote) => {
    if (vote.set_id) {
      votes[vote.set_id] = vote.vote_type;
    }
  });

  return votes;
}

export function userVotesQuery(userId: string) {
  return queryOptions({
    queryKey: userVotesKeys.user(userId),
    queryFn: () => fetchUserVotes(userId),
  });
}

export function useUserVotesQuery(userId: string | undefined) {
  return useQuery({
    ...userVotesQuery(userId!),
    enabled: !!userId,
  });
}
