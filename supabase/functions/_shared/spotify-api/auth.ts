import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const SpotifyTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
});

let cachedToken: {
  token: string;
  expiresAt: number;
} | null = null;

export async function getSpotifyAccessToken(): Promise<string> {
  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials are not configured");
  }

  if (
    cachedToken &&
    cachedToken.expiresAt > Date.now() + 60 * 1000 // 1 minute buffer
  ) {
    console.log("[getSpotifyAccessToken] Using cached access token");
    return cachedToken.token;
  }

  console.log("[getSpotifyAccessToken] Requesting access token...");

  const tokenUrl = "https://accounts.spotify.com/api/token";
  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: "grant_type=client_credentials",
    });

    console.log(
      `[getSpotifyAccessToken] Token response status: ${response.status} ${response.statusText}`,
    );

    if (!response.ok) {
      const errorBody = await response
        .text()
        .catch(() => "Unable to read error response");
      console.error("[getSpotifyAccessToken] Failed to get access token:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      throw new Error(
        `Failed to get Spotify access token: ${response.statusText}`,
      );
    }

    const rawData = await response.json();

    try {
      const tokenData = SpotifyTokenResponseSchema.parse(rawData);
      console.log(
        "[getSpotifyAccessToken] Successfully obtained and validated access token",
      );
      const token = tokenData.access_token;
      const expiresIn = tokenData.expires_in ?? 3600; // Default to 1 hour if not provided
      const expiresAt = Date.now() + expiresIn * 1000;

      cachedToken = { token, expiresAt };
      return token;
    } catch (validationError) {
      console.error("[getSpotifyAccessToken] Invalid token response format:", {
        error: validationError,
        rawData:
          JSON.stringify({ ...rawData, access_token: "[REDACTED]" }).slice(
            0,
            200,
          ) + "...",
      });
      throw new Error("Invalid access token response from Spotify");
    }
  } catch (error) {
    console.error("[getSpotifyAccessToken] Error obtaining access token:", {
      error,
    });
    throw error;
  }
}
