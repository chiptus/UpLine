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

function isAllowedStagingOrigin(origin: string): boolean {
  return origin.endsWith(".vercel.app");
}

export function buildCorsHeaders(req: Request): Record<string, string> {
  const prodOrigin = normalizeOrigin(
    Deno.env.get("APP_URL") ?? "https://getupline.com",
  );
  const requestOrigin = req.headers.get("Origin");

  const allowOrigin =
    !isProdEnvironment() &&
    requestOrigin &&
    isAllowedStagingOrigin(requestOrigin)
      ? requestOrigin
      : prodOrigin;

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}
