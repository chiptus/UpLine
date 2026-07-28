import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminQueries, type AdminRoleRow } from "./types";

export type AdminRole = AdminRoleRow & {
  profile?: {
    username: string | null;
    email: string | null;
  };
};

// Query Functions
async function fetchAdminRoles(): Promise<AdminRole[]> {
  const { data: roles, error } = await supabase
    .from("admin_roles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  if (roles && roles.length > 0) {
    // Fetch profile information for all admins in a single query
    const userIds = roles.map((role) => role.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, email")
      .in("id", userIds);

    const profilesByUserId = new Map(
      (profiles || []).map((profile) => [profile.id, profile]),
    );

    return roles.map((role) => ({
      ...role,
      profile: profilesByUserId.get(role.user_id) || {
        username: null,
        email: null,
      },
    }));
  }

  return [];
}

export function adminRolesQuery() {
  return queryOptions({
    queryKey: adminQueries.roles(),
    queryFn: fetchAdminRoles,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hooks
export function useAdminRolesQuery() {
  return useQuery(adminRolesQuery());
}
