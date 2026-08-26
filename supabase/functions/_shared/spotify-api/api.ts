import { getSpotifyAccessToken } from "./auth.ts";
import { SpotifyArtistSchema } from "./schemas.ts";
import { normalizeSpotifySearchResult } from "../normalize.ts";
import type { ProviderSearchOutcome } from "../types.ts";

export function extractSpotifyArtistId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "open.spotify.com") {
      return null;
    }
    const match = parsed.pathname.match(/\/artist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

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
