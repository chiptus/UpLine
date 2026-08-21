// The prod Supabase project's own URL, auto-injected as SUPABASE_URL at
// runtime. Used to tell prod apart from staging/local without extra deploy
// config, since only prod should be locked to a single allowed origin.
const PROD_SUPABASE_URL = "https://qssmazlqrmxiudxckxvi.supabase.co";
const DEFAULT_PROD_ORIGIN = "https://getupline.com";

// Fails closed: an unset or malformed SUPABASE_URL is treated as prod, so a
// broken config locks CORS down rather than accidentally loosening it.
function isProdEnvironment(): boolean {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) return true;

  return normalizeOrigin(supabaseUrl, PROD_SUPABASE_URL) === PROD_SUPABASE_URL;
}

// Strips any trailing slash/path so a misconfigured APP_URL (e.g. with a
// trailing "/") doesn't silently produce an invalid Allow-Origin value. Falls
// back to a known-good origin rather than passing through an unparseable one.
function normalizeOrigin(value: string, fallback: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return fallback;
  }
}

function isAllowedStagingOrigin(origin: string): boolean {
  return origin.endsWith(".vercel.app");
}

// Festival subdomains (e.g. own-spirit.getupline.com) are legitimate prod
// origins alongside the bare domain — see src/lib/subdomain.ts.
function isAllowedGetuplineOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return false;

    return (
      url.hostname === "getupline.com" ||
      url.hostname.endsWith(".getupline.com")
    );
  } catch {
    return false;
  }
}

export function buildCorsHeaders(req: Request): Record<string, string> {
  const prodOrigin = normalizeOrigin(
    Deno.env.get("APP_URL") ?? DEFAULT_PROD_ORIGIN,
    DEFAULT_PROD_ORIGIN,
  );
  const requestOrigin = req.headers.get("Origin");

  const allowOrigin =
    requestOrigin &&
    (isAllowedGetuplineOrigin(requestOrigin) ||
      (!isProdEnvironment() && isAllowedStagingOrigin(requestOrigin)))
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
