import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { analyticsQueries, type UserAnalytics } from "./types";

async function fetchUserAnalytics(): Promise<UserAnalytics[]> {
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, email, created_at")
    .order("created_at", { ascending: false });

  if (profilesError) throw new Error("Failed to fetch users");

  const usersWithCounts = await Promise.all(
    (profiles || []).map(async (profile) => {
      const { count } = await supabase
        .from("votes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id);

      return {
        ...profile,
        vote_count: count || 0,
      };
    }),
  );

  return usersWithCounts;
}

export function userAnalyticsQuery() {
  return queryOptions({
    queryKey: analyticsQueries.users(),
    queryFn: fetchUserAnalytics,
  });
}

export function useUserAnalyticsQuery() {
  return useQuery(userAnalyticsQuery());
}
