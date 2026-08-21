import type { SoundCloudUser } from "../_shared/soundcloud-api/schemas.ts";
import type { Candidate } from "./types.ts";

export function normalizeSoundCloudSearchResult(
  user: SoundCloudUser,
): Candidate {
  const name = user.display_name || user.username;

  return {
    name,
    url: user.permalink_url,
    imageUrl: user.avatar_url || null,
    description: user.description || null,
    followers: user.followers_count ?? null,
    genres: [],
  };
}
