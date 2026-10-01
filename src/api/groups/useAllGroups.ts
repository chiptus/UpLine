import { queryOptions } from "@tanstack/react-query";
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

/**
 * Every non-archived group, for a super-admin caller (the only role `groups` RLS
 * lets read them all). Any other caller falls
 * back to exactly the member-only result (never an error, never a leaked
 * full group list).
 */
async function fetchAllGroups(userId: string): Promise<Group[]> {
  const canViewAll = await isSuperAdmin(userId);

  if (!canViewAll) {
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

  return attachGroupMeta(groupsData || [], userId, userGroupIds);
}

async function isSuperAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_admin_role", {
    check_user_id: userId,
    check_role: "super_admin",
  });

  if (error) {
    console.error("Error checking super admin role:", error);
    return false;
  }

  return data === true;
}
