import type {
  ArtistSetWithCoPerformers,
  ArtistWithSets,
} from "@/api/artists/useArtistsMissingLinksByEdition";

export type LinkWizardQueueItem =
  | { kind: "artist"; id: string; artist: ArtistWithSets }
  | { kind: "set"; id: string; set: ArtistSetWithCoPerformers };

// Mixed queue (variant A from the #422 prototype): artists missing links come
// first, then the artist-less untyped sets as standalone steps. Untyped sets
// WITH artists are only handled on their artist's step — deliberately static,
// so skipping an artist never makes a new set item appear.
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

  const setItems: LinkWizardQueueItem[] = untypedSets
    .filter((set) => set.co_performers.length === 0)
    .filter(
      (set) =>
        selectedStageIds.length === 0 ||
        (set.stage_id ? selectedStageIds.includes(set.stage_id) : false),
    )
    .map((set) => ({ kind: "set", id: set.id, set }));

  return [...artistItems, ...setItems];
}
