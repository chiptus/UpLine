import { getSoundCloudAccessToken } from "../_shared/soundcloud-api/auth.ts";
import { fetchSoundCloudAPI } from "../_shared/soundcloud-api/api.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { SoundCloudUserSchema } from "../_shared/soundcloud-api/schemas.ts";
import { normalizeSoundCloudSearchResult } from "./normalize.ts";
import type { ProviderSearchOutcome } from "./types.ts";

const SoundCloudSearchResponseSchema = z.object({
  collection: z.array(SoundCloudUserSchema).optional(),
});

export async function searchSoundCloud(
  artistNames: string[],
): Promise<Map<string, ProviderSearchOutcome>> {
  const results = new Map<string, ProviderSearchOutcome>();

  const clientId = Deno.env.get("SOUNDCLOUD_CLIENT_ID");
  const clientSecret = Deno.env.get("SOUNDCLOUD_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("SoundCloud credentials are not configured");
  }

  const accessToken = await getSoundCloudAccessToken(clientId, clientSecret);

  for (const artistName of artistNames) {
    try {
      console.log(`[searchSoundCloud] Searching for artist: ${artistName}`);

      const endpoint = `/users?q=${encodeURIComponent(artistName)}&limit=3`;
      const response = await fetchSoundCloudAPI(
        endpoint,
        accessToken,
        SoundCloudSearchResponseSchema,
      );

      const candidates = (response.collection || []).map(
        normalizeSoundCloudSearchResult,
      );

      results.set(artistName, { candidates });
      console.log(
        `[searchSoundCloud] Found ${candidates.length} candidates for ${artistName}`,
      );
    } catch (error) {
      console.error(
        `[searchSoundCloud] Error searching for artist ${artistName}:`,
        error,
      );
      results.set(artistName, {
        candidates: [],
        error:
          error instanceof Error ? error.message : "SoundCloud search failed",
      });
    }
  }

  return results;
}
