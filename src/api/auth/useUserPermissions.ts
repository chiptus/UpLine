import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { userPermissionsKeys } from "./types";

async function checkUserPermissions(
  userId: string,
  permission: "edit_artists" | "is_admin",
) {
  try {
    // Use new admin roles system
    if (permission === "edit_artists") {
      const { data, error } = await supabase.rpc("can_edit_artists", {
        check_user_id: userId,
      });
      if (error) {
        console.error("Error checking edit_artists permission:", error);
        return false;
      }
      return data || false;
    } else if (permission === "is_admin") {
      const { data, error } = await supabase.rpc("is_admin", {
        check_user_id: userId,
      });
      if (error) {
        console.error("Error checking is_admin permission:", error);
        return false;
      }
      return data || false;
    }

    return false;
  } catch (error) {
    console.error("Error in checkUserPermissions:", error);
    return false;
  }
}

export function userPermissionsQuery(
  userId: string,
  permission: "edit_artists" | "is_admin",
) {
  return queryOptions({
    queryKey: userPermissionsKeys.user(userId, permission),
    queryFn: () => checkUserPermissions(userId, permission),
    staleTime: 5 * 60 * 1000, // 5 minutes - permissions don't change often
  });
}

export function useUserPermissionsQuery(
  userId: string | undefined,
  permission: "edit_artists" | "is_admin",
) {
  return useQuery({
    ...userPermissionsQuery(userId!, permission),
    enabled: !!userId,
  });
}
