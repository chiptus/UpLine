import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Group } from "./types";
import { groupsKeys } from "./types";

export function myGroupsQuery(userId: string) {
  return queryOptions({
    queryKey: groupsKeys.myGroups(userId),
    queryFn: () => fetchMyGroups(userId),
  });
}

/** Groups the given user is a member of. `is_member` is always `true` — no admin check. */
export async function fetchMyGroups(userId: string): Promise<Group[]> {
  const userGroupIds = await getUserGroupIds(userId);

  if (userGroupIds.length === 0) {
    return [];
  }

  const { data: groupsData, error } = await supabase
    .from("groups")
    .select("*")
    .eq("archived", false)
    .in("id", userGroupIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch groups");
  }

  return attachGroupMeta(groupsData || [], userId, userGroupIds);
}

export async function getUserGroupIds(userId: string): Promise<string[]> {
  const { data: userGroups, error } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user groups:", error);
    throw new Error("Failed to fetch user groups");
  }

  return userGroups?.map((ug) => ug.group_id) || [];
}

export async function attachGroupMeta(
  groups: Group[],
  userId: string,
  memberGroupIds: string[],
): Promise<Group[]> {
  const memberCountsByGroupId = await fetchMemberCountsByGroupId(
    groups.map((group) => group.id),
  );

  return groups.map((group) => ({
    ...group,
    member_count: memberCountsByGroupId.get(group.id) || 0,
    is_creator: group.created_by === userId,
    is_member: memberGroupIds.includes(group.id),
  }));
}

async function fetchMemberCountsByGroupId(
  groupIds: string[],
): Promise<Map<string, number>> {
  const memberCountsByGroupId = new Map<string, number>();

  if (groupIds.length === 0) {
    return memberCountsByGroupId;
  }

  const { data: counts, error } = await supabase.rpc("group_member_counts", {
    p_group_ids: groupIds,
  });

  if (error) {
    throw new Error("Failed to fetch group member counts");
  }

  for (const row of counts || []) {
    memberCountsByGroupId.set(row.group_id, row.member_count);
  }

  return memberCountsByGroupId;
}
