import type { Candidate, Provider } from "./types";

export interface CandidateUpdate {
  spotify_url?: string | null;
  soundcloud_url?: string | null;
  image_url?: string | null;
  description?: string | null;
}

export type SelectableField = "url" | "image" | "description";

export function mergeCandidateSelection(
  candidate: Candidate,
  provider: Provider,
  fields: SelectableField[],
): CandidateUpdate {
  const updates: CandidateUpdate = {};

  if (fields.includes("url")) {
    if (provider === "spotify") {
      updates.spotify_url = candidate.url;
    } else {
      updates.soundcloud_url = candidate.url;
    }
  }

  if (fields.includes("image") && candidate.imageUrl) {
    updates.image_url = candidate.imageUrl;
  }

  if (fields.includes("description") && candidate.description) {
    updates.description = candidate.description;
  }

  return updates;
}
