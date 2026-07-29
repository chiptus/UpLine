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
    const { data: counts, error: countsError } = await supabase.rpc(
      "user_vote_counts",
      { p_user_ids: userIds },
    );

    if (countsError) throw new Error("Failed to fetch vote counts");

    for (const row of counts || []) {
      voteCountsByUserId.set(row.user_id, row.vote_count);
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
