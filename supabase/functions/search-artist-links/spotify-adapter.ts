import { getSpotifyAccessToken } from "../_shared/spotify-api/auth.ts";
import { SpotifySearchResponseSchema } from "../_shared/spotify-api/schemas.ts";
import { normalizeSpotifySearchResult } from "./normalize.ts";
import type { ProviderSearchOutcome } from "./types.ts";

export async function searchSpotify(
  artistNames: string[],
): Promise<Map<string, ProviderSearchOutcome>> {
  const results = new Map<string, ProviderSearchOutcome>();

  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    console.warn(
      "[searchSpotify] Missing Spotify credentials, skipping Spotify search",
    );
    for (const name of artistNames) {
      results.set(name, { candidates: [] });
    }
    return results;
  }

  const accessToken = await getSpotifyAccessToken(clientId, clientSecret);

  for (const artistName of artistNames) {
    try {
      console.log(`[searchSpotify] Searching for artist: ${artistName}`);

      const query = encodeURIComponent(artistName);
      const endpoint = `https://api.spotify.com/v1/search?type=artist&q=${query}&limit=3`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => "Unable to read error response");
        console.error(
          `[searchSpotify] Error searching for artist ${artistName}:`,
          {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          },
        );
        results.set(artistName, {
          candidates: [],
          error: `Spotify search failed (${response.status})`,
        });
        continue;
      }

      const rawData = await response.json();

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
