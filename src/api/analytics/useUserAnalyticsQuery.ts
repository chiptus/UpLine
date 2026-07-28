import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { analyticsQueries, type UserAnalytics } from "./types";

async function fetchUserAnalytics(): Promise<UserAnalytics[]> {
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, email, created_at")
    .order("created_at", { ascending: false });

  if (profilesError) throw new Error("Failed to fetch users");

  const userIds = (profiles || []).map((profile) => profile.id);
  const voteCountsByUserId = new Map<string, number>();

  if (userIds.length > 0) {
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select("user_id")
      .in("user_id", userIds);

    if (votesError) throw new Error("Failed to fetch vote counts");

    for (const vote of votes || []) {
      voteCountsByUserId.set(
        vote.user_id,
        (voteCountsByUserId.get(vote.user_id) || 0) + 1,
      );
    }
  }

  return (profiles || []).map((profile) => ({
    ...profile,
    vote_count: voteCountsByUserId.get(profile.id) || 0,
  }));
}

export function userAnalyticsQuery() {
  return queryOptions({
    queryKey: analyticsQueries.users(),
    queryFn: fetchUserAnalytics,
  });
}
