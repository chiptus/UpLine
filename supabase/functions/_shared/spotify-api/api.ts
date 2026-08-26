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

export async function getSpotifyArtistById(
  artistId: string,
): Promise<ProviderFetchOutcome> {
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
          candidate: null,
          error: "Artist not found on Spotify",
        };
      }

      return {
        candidate: null,
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
        candidate: null,
        error: "Spotify returned data in an unexpected format",
      };
    }

    const artist = parseResponse.data;
    const candidate = normalizeSpotifySearchResult(artist);

    console.log(`[getSpotifyArtistById] Found artist: ${artist.name}`);
    return { candidate };
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
