import type { Candidate } from "./types.ts";

export async function searchSpotify(
  artistNames: string[],
): Promise<Map<string, Candidate[]>> {
  const results = new Map<string, Candidate[]>();

  for (const artistName of artistNames) {
    console.log(
      `[searchSpotify] Spotify search stub - no results for: ${artistName}`,
    );
    results.set(artistName, []);
  }

  return results;
}
