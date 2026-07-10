import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

export function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

type AuthResult =
  | { userId: string; adminClient: SupabaseClient; errorResponse: null }
  | {
      userId: null;
      adminClient: null;
      errorResponse: { status: number; body: string };
    };

export async function requireAdmin(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return {
      userId: null,
      adminClient: null,
      errorResponse: {
        status: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      },
    };
  }

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return {
      userId: null,
      adminClient: null,
      errorResponse: {
        status: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      },
    };
  }

  const adminClient = getAdminClient();
  const { data: adminRole, error: adminRoleError } = await adminClient
    .from("admin_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["admin", "super_admin"])
    .maybeSingle();

  if (adminRoleError) {
    console.error("requireAdmin: admin_roles lookup failed:", adminRoleError);
    return {
      userId: null,
      adminClient: null,
      errorResponse: {
        status: 500,
        body: JSON.stringify({ error: "Failed to verify admin role" }),
      },
    };
  }

  if (!adminRole) {
    return {
      userId: null,
      adminClient: null,
      errorResponse: {
        status: 403,
        body: JSON.stringify({ error: "Forbidden" }),
      },
    };
  }

  return { userId: user.id, adminClient, errorResponse: null };
}
