import { getSpotifyAccessToken } from "../_shared/spotify-api/auth.ts";
import {
  SpotifySearchResponseSchema,
  SpotifyArtistSchema,
} from "../_shared/spotify-api/schemas.ts";
import { normalizeSpotifySearchResult } from "./normalize.ts";
import type { ProviderSearchOutcome } from "./types.ts";

export async function getSpotifyArtistById(
  artistId: string,
): Promise<ProviderSearchOutcome> {
  try {
    const accessToken = await getSpotifyAccessToken();

    console.log(`[getSpotifyArtistById] Fetching artist: ${artistId}`);

    const endpoint = `https://api.spotify.com/v1/artists/${encodeURIComponent(artistId)}`;

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
        `[getSpotifyArtistById] Error fetching artist ${artistId}:`,
        {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        },
      );

      if (response.status === 404) {
        return {
          candidates: [],
          error: "Artist not found on Spotify",
        };
      }

      return {
        candidates: [],
        error: `Spotify lookup failed (${response.status})`,
      };
    }

    const rawData = await response.json();
    const parseResponse = SpotifyArtistSchema.safeParse(rawData);

    if (!parseResponse.success) {
      console.error(
        `[getSpotifyArtistById] Validation error for artist ${artistId}:`,
        {
          error: parseResponse.error,
        },
      );
      return {
        candidates: [],
        error: "Spotify returned data in an unexpected format",
      };
    }

    const artist = parseResponse.data;
    const candidate = normalizeSpotifySearchResult(artist);

    console.log(`[getSpotifyArtistById] Found artist: ${artist.name}`);
    return { candidates: [candidate] };
  } catch (error) {
    console.error(
      `[getSpotifyArtistById] Error fetching artist ${artistId}:`,
      error,
    );
    return {
      candidates: [],
      error: error instanceof Error ? error.message : "Spotify lookup failed",
    };
  }
}

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
