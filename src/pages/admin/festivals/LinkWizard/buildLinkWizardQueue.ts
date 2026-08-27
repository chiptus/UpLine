import type {
  ArtistSetWithCoPerformers,
  ArtistWithSets,
} from "@/api/artists/useArtistsMissingLinksByEdition";

export type LinkWizardQueueItem =
  | { kind: "artist"; id: string; artist: ArtistWithSets }
  | { kind: "set"; id: string; set: ArtistSetWithCoPerformers };

// Mixed queue (variant A from the #422 prototype): artists missing links come
// first, then the untyped sets no queued artist's step already covers — the
// artist-less ones, plus sets whose artists all have their links already.
export function buildLinkWizardQueue(
  artists: ArtistWithSets[],
  untypedSets: ArtistSetWithCoPerformers[],
  selectedStageIds: string[] = [],
): LinkWizardQueueItem[] {
  const artistItems: LinkWizardQueueItem[] = artists.map((artist) => ({
    kind: "artist",
    id: artist.id,
    artist,
  }));

  const coveredSetIds = new Set(
    artists.flatMap((artist) =>
      artist.sets.filter((set) => set.set_type === null).map((set) => set.id),
    ),
  );

  const setItems: LinkWizardQueueItem[] = untypedSets
    .filter((set) => !coveredSetIds.has(set.id))
    .filter(
      (set) =>
        selectedStageIds.length === 0 ||
        (set.stage_id ? selectedStageIds.includes(set.stage_id) : false),
    )
    .map((set) => ({ kind: "set", id: set.id, set }));

  return [...artistItems, ...setItems];
}
