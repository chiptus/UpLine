import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { fetchWithRetry, type RequestResult } from "../retry-utils.ts";

const SpotifyTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
});

let cachedToken: {
  token: string;
  expiresAt: number;
} | null = null;

export function resetSpotifyTokenCacheForTests(): void {
  cachedToken = null;
}

export async function getSpotifyAccessToken(): Promise<string> {
  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials are not configured");
  }

  const cached = getCachedToken();
  if (cached) {
    return cached;
  }

  cachedToken = await requestSpotifyToken(clientId, clientSecret);
  return cachedToken.token;
}

function getCachedToken(): string | null {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60 * 1000) {
    console.log("[getSpotifyAccessToken] Using cached access token");
    return cachedToken.token;
  }
  return null;
}

async function requestSpotifyToken(
  clientId: string,
  clientSecret: string,
): Promise<{ token: string; expiresAt: number }> {
  const rawData = await fetchTokenResponse(clientId, clientSecret);
  return parseTokenResponse(rawData);
}

async function fetchTokenResponse(
  clientId: string,
  clientSecret: string,
): Promise<unknown> {
  console.log("[getSpotifyAccessToken] Requesting access token...");

  const tokenUrl = "https://accounts.spotify.com/api/token";
  const result = await fetchWithRetry(
    () =>
      fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: "grant_type=client_credentials",
      }),
    async (response) => response.json(),
    { maxRetries: 2 },
  );

  if (!result.success) {
    handleFailedResult(result);
  }

  return result.data;
}

function handleFailedResult(
  result: Extract<RequestResult<unknown>, { success: false }>,
): never {
  if (result.type === "rate-limit") {
    console.error(
      "[getSpotifyAccessToken] Rate limited obtaining access token",
      {
        retryAfterSeconds: result.retryAfterSeconds,
      },
    );
    throw new Error(
      `Failed to get Spotify access token: rate limited (retry after ${result.retryAfterSeconds}s)`,
    );
  }
  console.error("[getSpotifyAccessToken] Error obtaining access token:", {
    error: result.error,
  });
  throw new Error("Failed to get Spotify access token");
}

function parseTokenResponse(rawData: unknown): {
  token: string;
  expiresAt: number;
} {
  try {
    const tokenData = SpotifyTokenResponseSchema.parse(rawData);
    console.log(
      "[getSpotifyAccessToken] Successfully obtained and validated access token",
    );
    const expiresIn = tokenData.expires_in ?? 3600; // Default to 1 hour if not provided
    return {
      token: tokenData.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    };
  } catch (validationError) {
    console.error("[getSpotifyAccessToken] Invalid token response format:", {
      error: validationError,
      rawData:
        JSON.stringify({
          ...(rawData as object),
          access_token: "[REDACTED]",
        }).slice(0, 200) + "...",
    });
    throw new Error("Invalid access token response from Spotify");
  }
}
