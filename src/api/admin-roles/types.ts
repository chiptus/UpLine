import type { Database } from "@/integrations/supabase/types";

export type AdminRoleRow = Database["public"]["Tables"]["admin_roles"]["Row"];

export const adminQueries = {
  all: () => ["admin"] as const,
  roles: () => [...adminQueries.all(), "roles"] as const,
};
