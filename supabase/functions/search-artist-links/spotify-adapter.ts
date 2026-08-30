import { getSpotifyAccessToken } from "../_shared/spotify-api/auth.ts";
import { fetchSpotifyAPI } from "../_shared/spotify-api/api.ts";
import { SpotifySearchResponseSchema } from "../_shared/spotify-api/schemas.ts";
import { normalizeSpotifySearchResult } from "../_shared/normalize.ts";
import type { RequestResult } from "../_shared/retry-utils.ts";
import type { ProviderSearchOutcome } from "./types.ts";

export async function searchSpotify(
  artistNames: string[],
): Promise<Map<string, ProviderSearchOutcome>> {
  const results = new Map<string, ProviderSearchOutcome>();
  const accessToken = await getSpotifyAccessToken();

  for (const artistName of artistNames) {
    if (results.has(artistName)) continue;

    const outcome = await searchSpotifyArtist(artistName, accessToken);
    results.set(artistName, outcome);

    if (outcome.rateLimitRetryAfter !== undefined) {
      fillRemainingWithRateLimit(
        results,
        artistNames,
        outcome.rateLimitRetryAfter,
      );
      break;
    }
  }

  return results;
}

async function searchSpotifyArtist(
  artistName: string,
  accessToken: string,
): Promise<ProviderSearchOutcome> {
  try {
    console.log(`[searchSpotify] Searching for artist: ${artistName}`);

    const endpoint = `/search?type=artist&q=${encodeURIComponent(artistName)}&limit=10`;
    const result = await fetchSpotifyAPI(
      endpoint,
      accessToken,
      SpotifySearchResponseSchema,
    );

    if (!result.success) {
      return handleSearchFailure(artistName, result);
    }

    const candidates = (result.data.artists?.items || []).map(
      normalizeSpotifySearchResult,
    );
    console.log(
      `[searchSpotify] Found ${candidates.length} candidates for ${artistName}`,
    );
    return { candidates };
  } catch (error) {
    console.error(
      `[searchSpotify] Error searching for artist ${artistName}:`,
      error,
    );
    return {
      candidates: [],
      error: error instanceof Error ? error.message : "Spotify search failed",
    };
  }
}

function handleSearchFailure(
  artistName: string,
  result: Extract<RequestResult<unknown>, { success: false }>,
): ProviderSearchOutcome {
  if (result.type === "rate-limit") {
    console.error(
      `[searchSpotify] Rate limited for artist ${artistName}, retry after ${result.retryAfterSeconds}s`,
    );
    return {
      candidates: [],
      error: "Spotify rate limited",
      rateLimitRetryAfter: result.retryAfterSeconds,
    };
  }

  console.error(
    `[searchSpotify] Error searching for artist ${artistName}:`,
    result.error,
  );
  return { candidates: [], error: "Spotify search failed" };
}

function fillRemainingWithRateLimit(
  results: Map<string, ProviderSearchOutcome>,
  artistNames: string[],
  retryAfterSeconds: number,
): void {
  for (const artistName of artistNames) {
    if (results.has(artistName)) continue;
    results.set(artistName, {
      candidates: [],
      error: "Spotify rate limited",
      rateLimitRetryAfter: retryAfterSeconds,
    });
  }
}
