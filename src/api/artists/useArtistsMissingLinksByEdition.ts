import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { artistsKeys, type Artist } from "./types";

export interface SetWithArtists {
  id: string;
  name: string;
  description: string | null;
  time_start: string | null;
  time_end: string | null;
  stage_id: string | null;
  stages: { name: string } | null;
  set_artists:
    | { artist_id: string; role: string | null; artists: Artist | null }[]
    | null;
}

export interface ArtistSetWithCoPerformers {
  id: string;
  name: string;
  description: string | null;
  time_start: string | null;
  time_end: string | null;
  stage_id: string | null;
  stage_name: string | null;
  co_performers: Array<{
    artist_id: string;
    artist_name: string;
    role: string | null;
  }>;
}

export type ArtistWithSets = Artist & { sets: ArtistSetWithCoPerformers[] };

export function selectArtistsMissingLinks(
  sets: SetWithArtists[],
): ArtistWithSets[] {
  const artists = sets
    .flatMap((set) => set.set_artists ?? [])
    .map((setArtist) => setArtist.artists)
    .filter((artist): artist is Artist => artist !== null);

  const artistsById = new Map(artists.map((artist) => [artist.id, artist]));

  return Array.from(artistsById.values())
    .filter((artist) => !artist.spotify_url || !artist.soundcloud_url)
    .map((artist) => ({
      ...artist,
      sets: selectArtistSetsById(sets, artist.id),
    }));
}

export function selectArtistSetsById(
  sets: SetWithArtists[],
  artistId: string,
): ArtistSetWithCoPerformers[] {
  return sets
    .filter((set) => set.set_artists?.some((sa) => sa.artist_id === artistId))
    .map((set) => ({
      id: set.id,
      name: set.name,
      description: set.description,
      time_start: set.time_start,
      time_end: set.time_end,
      stage_id: set.stage_id,
      stage_name: set.stages?.name ?? null,
      co_performers: (set.set_artists ?? []).map((sa) => ({
        artist_id: sa.artist_id,
        artist_name: sa.artists?.name || "Unknown Artist",
        role: sa.role,
      })),
    }));
}

async function fetchSetsWithArtistsByEdition(
  editionId: string,
): Promise<SetWithArtists[]> {
  const { data, error } = await supabase
    .from("sets")
    .select(
      `
      id,
      name,
      description,
      time_start,
      time_end,
      stage_id,
      stages (name),
      set_artists (
        artist_id,
        role,
        artists (
          *,
          artist_music_genres (music_genre_id)
        )
      )
    `,
    )
    .eq("festival_edition_id", editionId)
    .eq("archived", false);

  if (error) {
    console.error("Error fetching sets with artists by edition:", error);
    throw new Error("Failed to fetch sets");
  }

  return data ?? [];
}

export function setsWithArtistsByEditionQuery(editionId: string) {
  return queryOptions({
    queryKey: artistsKeys.list({ setsByEdition: editionId }),
    queryFn: () => fetchSetsWithArtistsByEdition(editionId),
  });
}

export function useArtistsMissingLinksByEditionQuery(
  editionId: string | undefined,
) {
  return useQuery({
    ...setsWithArtistsByEditionQuery(editionId!),
    enabled: !!editionId,
    select: selectArtistsMissingLinks,
  });
}
