import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

// The prod Supabase project's own URL, auto-injected as SUPABASE_URL at
// runtime. Used to tell prod apart from staging/local without extra deploy
// config, since only prod should be locked to a single allowed origin.
const PROD_SUPABASE_URL = "https://qssmazlqrmxiudxckxvi.supabase.co";

function isProdEnvironment(): boolean {
  return Deno.env.get("SUPABASE_URL") === PROD_SUPABASE_URL;
}

// Strips any trailing slash/path so a misconfigured APP_URL (e.g. with a
// trailing "/") doesn't silently produce an invalid Allow-Origin value.
function normalizeOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}

export function buildCorsHeaders(req: Request): Record<string, string> {
  const prodOrigin = normalizeOrigin(
    Deno.env.get("APP_URL") ?? "https://getupline.com",
  );
  const requestOrigin = req.headers.get("Origin");

  return {
    "Access-Control-Allow-Origin":
      !isProdEnvironment() && requestOrigin ? requestOrigin : prodOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

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
