import type { Candidate, Provider } from "./types";

export interface CandidateUpdate {
  providerUrl?: Partial<Record<Provider, string>>;
  image_url?: string | null;
  description?: string | null;
  soundcloudFollowers?: number;
}

export type SelectableField = "url" | "image" | "description";

export interface StagedValues {
  image_url?: string | null | undefined;
  description?: string | null | undefined;
}

export function mergeCandidateSelection(
  candidate: Candidate,
  provider: Provider,
  fields: SelectableField[],
  staged: StagedValues = {},
): CandidateUpdate {
  const updates: CandidateUpdate = {};

  if (fields.includes("url")) {
    updates.providerUrl = { [provider]: candidate.url };

    // Spotify stopped returning followers for non-extended apps, so only
    // SoundCloud has a real value to persist.
    if (provider === "soundcloud" && candidate.followers !== null) {
      updates.soundcloudFollowers = candidate.followers;
    }
  }

  if (fields.includes("image") && candidate.imageUrl && !staged.image_url) {
    updates.image_url = candidate.imageUrl;
  }

  if (
    fields.includes("description") &&
    candidate.description &&
    !staged.description
  ) {
    updates.description = candidate.description;
  }

  return updates;
}
