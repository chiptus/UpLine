import { getSpotifyAccessToken } from "../_shared/spotify-api/auth.ts";
import { SpotifySearchResponseSchema } from "../_shared/spotify-api/schemas.ts";
import { normalizeSpotifySearchResult } from "../_shared/normalize.ts";
import { fetchWithRetry } from "../_shared/retry-utils.ts";
import type { ProviderSearchOutcome } from "./types.ts";

export async function searchSpotify(
  artistNames: string[],
): Promise<Map<string, ProviderSearchOutcome>> {
  const results = new Map<string, ProviderSearchOutcome>();

  const accessToken = await getSpotifyAccessToken();

  for (const artistName of artistNames) {
    try {
      console.log(`[searchSpotify] Searching for artist: ${artistName}`);

      const query = encodeURIComponent(artistName);
      const endpoint = `https://api.spotify.com/v1/search?type=artist&q=${query}&limit=10`;

      const result = await fetchWithRetry(
        () =>
          fetch(endpoint, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }),
        async (response) => response.json(),
        { maxRetries: 2 },
      );

      if (!result.success) {
        if (result.type === "rate-limit") {
          console.error(
            `[searchSpotify] Rate limited for artist ${artistName}, retry after ${result.retryAfterSeconds}s`,
          );
          results.set(artistName, {
            candidates: [],
            error: `Spotify rate limited`,
            rateLimitRetryAfter: result.retryAfterSeconds,
          });
        } else {
          console.error(
            `[searchSpotify] Error searching for artist ${artistName}:`,
            result.error,
          );
          results.set(artistName, {
            candidates: [],
            error: "Spotify search failed",
          });
        }
        continue;
      }

      const rawData = result.data;

      const parseResponse = SpotifySearchResponseSchema.safeParse(rawData);
      if (!parseResponse.success) {
        console.error(
          `[searchSpotify] Validation error for artist ${artistName}:`,
          {
            error: parseResponse.error,
          },
        );
        results.set(artistName, {
          candidates: [],
          error: "Spotify search failed",
        });
        continue;
      }

      const searchData = parseResponse.data;
      const candidates = (searchData.artists?.items || []).map(
        normalizeSpotifySearchResult,
      );

      results.set(artistName, { candidates });
      console.log(
        `[searchSpotify] Found ${candidates.length} candidates for ${artistName}`,
      );
    } catch (error) {
      console.error(
        `[searchSpotify] Error searching for artist ${artistName}:`,
        error,
      );
      results.set(artistName, {
        candidates: [],
        error: error instanceof Error ? error.message : "Spotify search failed",
      });
    }
  }

  return results;
}
