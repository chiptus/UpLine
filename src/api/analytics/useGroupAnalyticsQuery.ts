import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { analyticsQueries, type GroupAnalytics } from "./types";

async function fetchGroupAnalytics(): Promise<GroupAnalytics[]> {
  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id, name, created_at")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (groupsError) throw new Error("Failed to fetch groups");

  const groupsWithCounts = await Promise.all(
    (groups || []).map(async (group) => {
      const { count, error: countError } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", group.id);

      if (countError) throw new Error("Failed to fetch group member count");

      return {
        ...group,
        member_count: count || 0,
      };
    }),
  );

  return groupsWithCounts;
}

export function groupAnalyticsQuery() {
  return queryOptions({
    queryKey: analyticsQueries.groups(),
    queryFn: fetchGroupAnalytics,
  });
}

export function useGroupAnalyticsQuery() {
  return useSuspenseQuery(groupAnalyticsQuery());
}
