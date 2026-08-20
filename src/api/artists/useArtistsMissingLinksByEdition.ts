import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { artistsKeys, type Artist } from "./types";

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

  const artistsById = new Map<string, Artist>();
  for (const set of data ?? []) {
    for (const setArtist of set.set_artists ?? []) {
      const artist = setArtist.artists;
      if (artist) {
        artistsById.set(artist.id, artist);
      }
    }
  }

  return Array.from(artistsById.values()).filter(
    (artist) => !artist.spotify_url || !artist.soundcloud_url,
  );
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
