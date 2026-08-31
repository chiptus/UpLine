import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { fetchWithRetry, type RequestResult } from "../retry-utils.ts";
import { getSpotifyAccessToken } from "./auth.ts";
import { SpotifyArtistSchema } from "./schemas.ts";
import { normalizeSpotifySearchResult } from "../normalize.ts";
import type { ProviderFetchOutcome } from "../types.ts";

export function extractSpotifyArtistId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "open.spotify.com"
    ) {
      return null;
    }
    const match = parsed.pathname.match(/^\/artist\/([a-zA-Z0-9]+)\/?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function fetchSpotifyAPI<T>(
  endpoint: string,
  accessToken: string,
  schema: z.ZodSchema<T>,
): Promise<RequestResult<T>> {
  const fullUrl = `https://api.spotify.com/v1${endpoint}`;
  console.log(`[fetchSpotifyAPI] Making request to: ${fullUrl}`);

  const result = await fetchWithRetry(
    () =>
      fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }),
    async (response) => response.json(),
    { maxRetries: 2 },
  );

  if (!result.success) {
    return result;
  }

  const parseResponse = schema.safeParse(result.data);
  if (!parseResponse.success) {
    console.error(`[fetchSpotifyAPI] Validation error for ${endpoint}:`, {
      error: parseResponse.error,
      rawData: JSON.stringify(result.data).slice(0, 200) + "...",
    });
    return {
      success: false,
      type: "other",
      error: new Error("Spotify returned data in an unexpected format"),
    };
  }

  return { success: true, data: parseResponse.data };
}

export async function getSpotifyArtistById(
  artistId: string,
): Promise<ProviderFetchOutcome> {
  try {
    const accessToken = await getSpotifyAccessToken();

    console.log(`[getSpotifyArtistById] Fetching artist: ${artistId}`);

    const endpoint = `/artists/${encodeURIComponent(artistId)}`;
    const result = await fetchSpotifyAPI(
      endpoint,
      accessToken,
      SpotifyArtistSchema,
    );

    if (!result.success) {
      return handleFetchFailure(artistId, result);
    }

    const artist = result.data;
    console.log(`[getSpotifyArtistById] Found artist: ${artist.name}`);
    return { candidate: normalizeSpotifySearchResult(artist) };
  } catch (error) {
    console.error(
      `[getSpotifyArtistById] Error fetching artist ${artistId}:`,
      error,
    );
    return {
      candidate: null,
      error: error instanceof Error ? error.message : "Spotify lookup failed",
    };
  }
}

function handleFetchFailure(
  artistId: string,
  result: Extract<RequestResult<unknown>, { success: false }>,
): ProviderFetchOutcome {
  if (result.type === "rate-limit") {
    console.error(
      `[getSpotifyArtistById] Rate limited fetching artist ${artistId}, retry after ${result.retryAfterSeconds}s`,
    );
    return { candidate: null, error: "Spotify rate limited" };
  }

  console.error(
    `[getSpotifyArtistById] Error fetching artist ${artistId}:`,
    result.error,
  );

  if (result.status === 404) {
    return { candidate: null, error: "Artist not found on Spotify" };
  }

  return {
    candidate: null,
    error: `Spotify lookup failed${result.status ? ` (${result.status})` : ""}`,
  };
}
