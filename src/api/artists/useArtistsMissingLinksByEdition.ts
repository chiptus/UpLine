import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { artistsKeys, type Artist } from "./types";

export interface SetWithArtists {
  set_artists: { artists: Artist | null }[] | null;
}

export function selectArtistsMissingLinks(sets: SetWithArtists[]): Artist[] {
  const artists = sets
    .flatMap((set) => set.set_artists ?? [])
    .map((setArtist) => setArtist.artists)
    .filter((artist): artist is Artist => artist !== null);

  const artistsById = new Map(artists.map((artist) => [artist.id, artist]));

  return Array.from(artistsById.values()).filter(
    (artist) => !artist.spotify_url || !artist.soundcloud_url,
  );
}

async function fetchArtistsMissingLinksByEdition(
  editionId: string,
): Promise<Artist[]> {
  const { data, error } = await supabase
    .from("sets")
    .select(
      `
      set_artists (
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
    console.error("Error fetching artists missing links by edition:", error);
    throw new Error("Failed to fetch artists");
  }

  return selectArtistsMissingLinks(data ?? []);
}

export function artistsMissingLinksByEditionQuery(editionId: string) {
  return queryOptions({
    queryKey: artistsKeys.list({ missingLinksByEdition: editionId }),
    queryFn: () => fetchArtistsMissingLinksByEdition(editionId),
  });
}

export function useArtistsMissingLinksByEditionQuery(
  editionId: string | undefined,
) {
  return useQuery({
    ...artistsMissingLinksByEditionQuery(editionId!),
    enabled: !!editionId,
  });
}
