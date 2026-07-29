import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { analyticsQueries, type GroupAnalytics } from "./types";

async function fetchGroupAnalytics(): Promise<GroupAnalytics[]> {
  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id, name, created_at")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (groupsError) throw new Error("Failed to fetch groups");

  const groupIds = (groups || []).map((group) => group.id);
  const memberCountsByGroupId = new Map<string, number>();

  if (groupIds.length > 0) {
    const { data: counts, error: countsError } = await supabase.rpc(
      "group_member_counts",
      { p_group_ids: groupIds },
    );

    if (countsError) throw new Error("Failed to fetch group member counts");

    for (const row of counts || []) {
      memberCountsByGroupId.set(row.group_id, row.member_count);
    }
  }

  return (groups || []).map((group) => ({
    ...group,
    member_count: memberCountsByGroupId.get(group.id) || 0,
  }));
}

export function groupAnalyticsQuery() {
  return queryOptions({
    queryKey: analyticsQueries.groups(),
    queryFn: fetchGroupAnalytics,
  });
}
