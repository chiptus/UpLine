import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAdminClient } from "../auth.ts";
import { SoundCloudTokenResponseSchema } from "./schemas.ts";
import type { SoundCloudTokenResponse } from "./schemas.ts";

// Token endpoint per https://developers.soundcloud.com/docs/api/guide
// (secure.soundcloud.com, not the legacy api.soundcloud.com/oauth2/token).
const TOKEN_URL = "https://secure.soundcloud.com/oauth/token";
const PROVIDER = "soundcloud";
const EXPIRY_BUFFER_MS = 60 * 1000;
const LEASE_SECONDS = 15;
const POLL_INTERVAL_MS = 500;
const MAX_WAIT_MS = 15 * 1000;
// Keep the token request strictly shorter than the lease so a hung request
// can't outlive its own lease and race the next holder.
const TOKEN_REQUEST_TIMEOUT_MS = 10 * 1000;

let cachedToken: { token: string; expiresAt: number } | null = null;

interface StoredToken {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
}

// SoundCloud's token endpoint is rate limited (50 client_credentials grants
// per 12h per app) and refresh tokens are single-use, so tokens are persisted
// in the provider_tokens table and shared across instances. Acquisition is
// serialized through a DB lease so only one instance ever hits the token
// endpoint; everyone else reuses the stored token or waits for the refresh.
export async function getSoundCloudAccessToken(): Promise<string> {
  const clientId = Deno.env.get("SOUNDCLOUD_CLIENT_ID");
  const clientSecret = Deno.env.get("SOUNDCLOUD_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("SoundCloud credentials are not configured");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + EXPIRY_BUFFER_MS) {
    return cachedToken.token;
  }

  const supabase = getAdminClient();

  const stored = await readStoredToken(supabase);
  if (isFresh(stored)) {
    console.log("[getSoundCloudAccessToken] Using stored access token");
    return cacheToken(stored.access_token, stored.expires_at);
  }

  const deadline = Date.now() + MAX_WAIT_MS;
  while (true) {
    const lease = await claimLease(supabase);

    if (lease.claimed) {
      try {
        const tokenData = await requestToken(
          clientId,
          clientSecret,
          lease.refreshToken,
        );
        await storeToken(supabase, tokenData, lease.leaseId);
        cachedToken = {
          token: tokenData.access_token,
          expiresAt: Date.now() + tokenData.expires_in * 1000,
        };
        return tokenData.access_token;
      } catch (error) {
        await releaseLease(supabase, lease.leaseId);
        throw error;
      }
    }

    const refreshed = await readStoredToken(supabase);
    if (isFresh(refreshed)) {
      console.log(
        "[getSoundCloudAccessToken] Using token refreshed by another instance",
      );
      return cacheToken(refreshed.access_token, refreshed.expires_at);
    }

    if (Date.now() >= deadline) {
      throw new Error(
        "SoundCloud authentication is busy, please try again shortly",
      );
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

function isFresh(
  row: StoredToken | null,
): row is StoredToken & { access_token: string; expires_at: string } {
  return Boolean(
    row?.access_token &&
      row.expires_at &&
      new Date(row.expires_at).getTime() > Date.now() + EXPIRY_BUFFER_MS,
  );
}

function cacheToken(token: string, expiresAt: string): string {
  cachedToken = { token, expiresAt: new Date(expiresAt).getTime() };
  return token;
}

async function readStoredToken(
  supabase: SupabaseClient,
): Promise<StoredToken | null> {
  const { data, error } = await supabase
    .from("provider_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("provider", PROVIDER)
    .maybeSingle();

  if (error) {
    console.error(
      "[getSoundCloudAccessToken] Failed to read stored token:",
      error,
    );
    return null;
  }
  return data;
}

async function claimLease(
  supabase: SupabaseClient,
): Promise<
  | { claimed: true; refreshToken: string | null; leaseId: string }
  | { claimed: false }
> {
  const { data, error } = await supabase.rpc("claim_provider_token_lease", {
    p_provider: PROVIDER,
    p_lease_seconds: LEASE_SECONDS,
  });

  if (error) {
    // Fail closed: proceeding without the lease would let every cold
    // instance stampede the token endpoint, which is exactly what the
    // lease exists to prevent.
    console.error("[getSoundCloudAccessToken] Failed to claim lease:", error);
    throw new Error(
      "SoundCloud authentication is temporarily unavailable, please try again",
    );
  }

  const rows = data as
    | { refresh_token: string | null; lease_id: string }[]
    | null;
  if (!rows || rows.length === 0) {
    return { claimed: false };
  }
  return {
    claimed: true,
    refreshToken: rows[0].refresh_token,
    leaseId: rows[0].lease_id,
  };
}

async function storeToken(
  supabase: SupabaseClient,
  tokenData: SoundCloudTokenResponse,
  leaseId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc("store_provider_token", {
    p_provider: PROVIDER,
    p_lease_id: leaseId,
    p_access_token: tokenData.access_token,
    p_refresh_token: tokenData.refresh_token,
    p_expires_in: tokenData.expires_in,
  });

  if (error) {
    console.error("[getSoundCloudAccessToken] Failed to persist token:", error);
  } else if (data === false) {
    console.warn(
      "[getSoundCloudAccessToken] Lease expired before the token was stored; keeping it in-memory only",
    );
  }
}

async function releaseLease(
  supabase: SupabaseClient,
  leaseId: string,
): Promise<void> {
  const { error } = await supabase.rpc("release_provider_token_lease", {
    p_provider: PROVIDER,
    p_lease_id: leaseId,
  });

  if (error) {
    console.error("[getSoundCloudAccessToken] Failed to release lease:", error);
  }
}

async function requestToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string | null,
): Promise<SoundCloudTokenResponse> {
  if (refreshToken) {
    const refreshed = await tryRefreshGrant(
      clientId,
      clientSecret,
      refreshToken,
    );
    if (refreshed) {
      return refreshed;
    }
  }
  return await clientCredentialsGrant(clientId, clientSecret);
}

// Refresh grant sends credentials in the form body (unlike client_credentials,
// which requires HTTP Basic), per the SoundCloud API guide.
async function tryRefreshGrant(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<SoundCloudTokenResponse | null> {
  console.log("[getSoundCloudAccessToken] Refreshing access token...");

  let response: Response;
  try {
    response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
      signal: AbortSignal.timeout(TOKEN_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    console.error("[getSoundCloudAccessToken] Refresh request failed:", error);
    return null;
  }

  if (!response.ok) {
    const errorBody = await response
      .text()
      .catch(() => "Unable to read error response");
    console.error("[getSoundCloudAccessToken] Refresh grant failed:", {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
    if (response.status === 429) {
      throw new Error("SoundCloud rate limit exceeded, please try again later");
    }
    return null;
  }

  const parsed = SoundCloudTokenResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    console.error(
      "[getSoundCloudAccessToken] Invalid refresh response format:",
      parsed.error,
    );
    return null;
  }

  console.log("[getSoundCloudAccessToken] Successfully refreshed access token");
  return parsed.data;
}

async function clientCredentialsGrant(
  clientId: string,
  clientSecret: string,
): Promise<SoundCloudTokenResponse> {
  console.log("[getSoundCloudAccessToken] Requesting new access token...");

  let response: Response;
  try {
    response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(TOKEN_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    console.error("[getSoundCloudAccessToken] Token request failed:", error);
    throw new Error("Failed to reach SoundCloud, please try again later");
  }

  if (!response.ok) {
    const errorBody = await response
      .text()
      .catch(() => "Unable to read error response");
    console.error("[getSoundCloudAccessToken] Failed to get access token:", {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
    if (response.status === 429) {
      throw new Error("SoundCloud rate limit exceeded, please try again later");
    }
    throw new Error(
      `Failed to get SoundCloud access token: ${response.statusText}`,
    );
  }

  const parsed = SoundCloudTokenResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    console.error("[getSoundCloudAccessToken] Invalid token response format:", {
      error: parsed.error,
    });
    throw new Error("Invalid access token response from SoundCloud");
  }

  console.log("[getSoundCloudAccessToken] Successfully obtained access token");
  return parsed.data;
}
