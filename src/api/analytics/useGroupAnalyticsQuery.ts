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
    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", groupIds);

    if (membersError) throw new Error("Failed to fetch group member counts");

    for (const member of members || []) {
      memberCountsByGroupId.set(
        member.group_id,
        (memberCountsByGroupId.get(member.group_id) || 0) + 1,
      );
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
