import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

type AuthResult =
  | { userId: string; errorResponse: null }
  | { userId: null; errorResponse: { status: number; body: string } };

export async function requireAdmin(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { userId: null, errorResponse: { status: 401, body: JSON.stringify({ error: "Unauthorized" }) } };
  }

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return { userId: null, errorResponse: { status: 401, body: JSON.stringify({ error: "Unauthorized" }) } };
  }

  const adminClient = getAdminClient();
  const { data: adminRole } = await adminClient
    .from("admin_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["admin", "super_admin"])
    .maybeSingle();

  if (!adminRole) {
    return { userId: null, errorResponse: { status: 403, body: JSON.stringify({ error: "Forbidden" }) } };
  }

  return { userId: user.id, errorResponse: null };
}
