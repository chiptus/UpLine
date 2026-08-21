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
        await storeToken(supabase, tokenData);
        cachedToken = {
          token: tokenData.access_token,
          expiresAt: Date.now() + tokenData.expires_in * 1000,
        };
        return tokenData.access_token;
      } catch (error) {
        await releaseLease(supabase);
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
): Promise<{ claimed: boolean; refreshToken: string | null }> {
  const { data, error } = await supabase.rpc("claim_provider_token_lease", {
    p_provider: PROVIDER,
    p_lease_seconds: LEASE_SECONDS,
  });

  if (error) {
    // Degraded mode: without the lease we can't guarantee serialization, but
    // failing the search over a lease-bookkeeping error would be worse.
    console.error("[getSoundCloudAccessToken] Failed to claim lease:", error);
    return { claimed: true, refreshToken: null };
  }

  const rows = data as { refresh_token: string | null }[] | null;
  if (!rows || rows.length === 0) {
    return { claimed: false, refreshToken: null };
  }
  return { claimed: true, refreshToken: rows[0].refresh_token };
}

async function storeToken(
  supabase: SupabaseClient,
  tokenData: SoundCloudTokenResponse,
): Promise<void> {
  const { error } = await supabase.rpc("store_provider_token", {
    p_provider: PROVIDER,
    p_access_token: tokenData.access_token,
    p_refresh_token: tokenData.refresh_token,
    p_expires_in: tokenData.expires_in,
  });

  if (error) {
    console.error("[getSoundCloudAccessToken] Failed to persist token:", error);
  }
}

async function releaseLease(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase
    .from("provider_tokens")
    .update({ lock_until: null })
    .eq("provider", PROVIDER);

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

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

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

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: "grant_type=client_credentials",
  });

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
