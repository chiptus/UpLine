import type { Artist } from "@/api/artists/types";
import type { Candidate, Provider } from "./types";

export interface CandidateUpdate {
  spotify_url?: string | null;
  soundcloud_url?: string | null;
  image_url?: string | null;
  description?: string | null;
}

export interface MergeContext {
  artist: Artist;
  stagedUpdates: CandidateUpdate;
}

export function mergeCandidateSelection(
  context: MergeContext,
  candidate: Candidate,
  provider: Provider,
): CandidateUpdate {
  const { artist, stagedUpdates } = context;

  const updates: CandidateUpdate = {};

  if (provider === "spotify") {
    updates.spotify_url = candidate.url;
  } else if (provider === "soundcloud") {
    updates.soundcloud_url = candidate.url;
  }

  const existingImage = artist.image_url || stagedUpdates.image_url || null;

  if (!existingImage && candidate.imageUrl) {
    updates.image_url = candidate.imageUrl;
  }

  const existingDescription =
    artist.description || stagedUpdates.description || null;

  if (!existingDescription && candidate.description) {
    updates.description = candidate.description;
  }

  return updates;
}
