import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Group } from "./types";
import { groupsKeys } from "./types";
import { attachGroupMeta, fetchMyGroups, getUserGroupIds } from "./useMyGroups";

export function allGroupsQuery(userId: string) {
  return queryOptions({
    queryKey: groupsKeys.allGroups(userId),
    queryFn: () => fetchAllGroups(userId),
  });
}

export function useAllGroupsQuery(userId: string) {
  return useSuspenseQuery(allGroupsQuery(userId));
}

/**
 * Every non-archived group, for an admin caller. A non-admin caller falls
 * back to exactly the member-only result (never an error, never a leaked
 * full group list).
 */
async function fetchAllGroups(userId: string): Promise<Group[]> {
  const isAdmin = await isUserAdmin(userId);

  if (!isAdmin) {
    return fetchMyGroups(userId);
  }

  const [userGroupIds, { data: groupsData, error }] = await Promise.all([
    getUserGroupIds(userId),
    supabase
      .from("groups")
      .select("*")
      .eq("archived", false)
      .order("created_at", { ascending: false }),
  ]);

  if (error) {
    throw new Error(error.message || "Failed to fetch groups");
  }

  return attachGroupMeta(groupsData || [], userId, {
    alwaysMember: false,
    memberGroupIds: userGroupIds,
  });
}

async function isUserAdmin(userId: string): Promise<boolean> {
  const { data: isAdminData, error } = await supabase
    .from("admin_roles")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (error) {
    console.error("Error checking admin role:", error);
    return false;
  }

  return isAdminData && isAdminData.length > 0;
}
