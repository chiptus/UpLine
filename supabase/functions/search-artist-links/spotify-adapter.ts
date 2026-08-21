import type { ProviderSearchOutcome } from "./types.ts";

export async function searchSpotify(
  artistNames: string[],
): Promise<Map<string, ProviderSearchOutcome>> {
  const results = new Map<string, ProviderSearchOutcome>();

  for (const artistName of artistNames) {
    console.log(
      `[searchSpotify] Spotify search stub - no results for: ${artistName}`,
    );
    results.set(artistName, { candidates: [] });
  }

  return results;
}
