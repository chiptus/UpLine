import type { ArtistWithSets } from "@/api/artists/useArtistsMissingLinksByEdition";

export function filterArtistsByStage(
  artists: ArtistWithSets[],
  selectedStageIds: string[],
): ArtistWithSets[] {
  if (selectedStageIds.length === 0) {
    return artists;
  }

  return artists.filter((artist) =>
    artist.sets.some((set) =>
      set.stage_id ? selectedStageIds.includes(set.stage_id) : false,
    ),
  );
}
