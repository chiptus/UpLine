import type { Database } from "@/integrations/supabase/types";
import { registerCleanup, testSupabase } from "../harness";
import { SEEDED_USER_ID } from "./constants";

type AdminRole = Database["public"]["Enums"]["admin_role"];

/**
 * Grants a user an `admin_roles` row so both RLS ("Admins can manage X")
 * and the app's own `is_admin`/`can_edit_artists` RPCs see them as an
 * admin. Self-cleans.
 */
export async function grantAdminRole(
  userId: string,
  role: AdminRole = "admin",
): Promise<void> {
  const { error } = await testSupabase.from("admin_roles").insert({
    user_id: userId,
    role,
    created_by: SEEDED_USER_ID,
  });
  if (error) throw error;

  registerCleanup(async () => {
    const { error: deleteError } = await testSupabase
      .from("admin_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);
    if (deleteError) throw deleteError;
  });
}
