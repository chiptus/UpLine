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

  if (roles) {
    // Fetch profile information for each admin
    const rolesWithProfiles = await Promise.all(
      roles.map(async (role) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, email")
          .eq("id", role.user_id)
          .single();

        return {
          ...role,
          profile: profile || { username: null, email: null },
        };
      }),
    );

    return rolesWithProfiles;
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
