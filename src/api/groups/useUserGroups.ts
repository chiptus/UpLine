import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Group } from "./types";
import { groupsKeys } from "./types";

// Check if user is admin
async function isUserAdmin(userId: string): Promise<boolean> {
  const { data: isAdminData, error: isAdminError } = await supabase
    .from("admin_roles")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (isAdminError) {
    console.error("Error checking admin role:", isAdminError);
    return false;
  }

  return isAdminData && isAdminData.length > 0;
}

// Get user's group IDs
async function getUserGroupIds(userId: string): Promise<string[]> {
  const { data: userGroups, error: userGroupsError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);

  if (userGroupsError) {
    console.error("Error fetching user groups:", userGroupsError);
    throw new Error("Failed to fetch user groups");
  }

  return userGroups?.map((ug) => ug.group_id) || [];
}

// Helper function to add member counts to groups
async function addMemberCounts(
  groups: Group[],
  userId: string,
  userGroupIds: string[],
  isUserGroupsOnly: boolean = false,
): Promise<Group[]> {
  const groupIds = groups.map((group) => group.id);
  const memberCountsByGroupId = await fetchMemberCountsByGroupId(groupIds);

  return groups.map((group) => ({
    ...group,
    member_count: memberCountsByGroupId.get(group.id) || 0,
    is_creator: group.created_by === userId,
    is_member: isUserGroupsOnly ? true : userGroupIds.includes(group.id),
  }));
}

async function fetchMemberCountsByGroupId(
  groupIds: string[],
): Promise<Map<string, number>> {
  const memberCountsByGroupId = new Map<string, number>();

  if (groupIds.length === 0) {
    return memberCountsByGroupId;
  }

  const { data: members, error } = await supabase
    .from("group_members")
    .select("group_id")
    .in("group_id", groupIds);

  if (error) {
    console.error("Error fetching group member counts:", error);
    return memberCountsByGroupId;
  }

  for (const member of members || []) {
    memberCountsByGroupId.set(
      member.group_id,
      (memberCountsByGroupId.get(member.group_id) || 0) + 1,
    );
  }

  return memberCountsByGroupId;
}

// Fetch groups from database
async function fetchGroupsFromDb(
  shouldFetchAll: boolean,
  userGroupIds: string[],
) {
  let groupsQuery = supabase
    .from("groups")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (!shouldFetchAll) {
    // Fetch only user's groups
    if (userGroupIds.length === 0) {
      return []; // User has no groups
    }
    groupsQuery = groupsQuery.in("id", userGroupIds);
  }

  const { data: groupsData, error } = await groupsQuery;

  if (error) {
    throw new Error(error.message || "Failed to fetch groups");
  }

  return groupsData || [];
}

// Business logic function
async function fetchUserGroups(
  userId: string,
  { all = false }: { all?: boolean } = {},
): Promise<Group[]> {
  const userGroupIds = await getUserGroupIds(userId);

  let shouldFetchAllGroups = false;
  if (all) {
    const isAdmin = await isUserAdmin(userId);
    shouldFetchAllGroups = isAdmin;
  }

  const groupsData = await fetchGroupsFromDb(
    shouldFetchAllGroups,
    userGroupIds,
  );

  if (groupsData.length === 0) {
    return [];
  }

  return addMemberCounts(
    groupsData,
    userId,
    userGroupIds,
    !shouldFetchAllGroups,
  );
}

export function userGroupsQuery(
  userId: string,
  params: { all?: boolean } = {},
) {
  return queryOptions({
    queryKey: groupsKeys.user(userId, params),
    queryFn: () => fetchUserGroups(userId, params),
  });
}

export function useUserGroupsQuery(
  userId: string | undefined,
  params: { all?: boolean } = {},
) {
  return useQuery({
    ...userGroupsQuery(userId!, params),
    enabled: !!userId,
  });
}
