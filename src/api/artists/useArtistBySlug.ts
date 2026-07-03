import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Artist } from "./types";
import { artistsKeys } from "./types";

async function fetchArtistBySlug(slug: string): Promise<Artist> {
  const { data, error } = await supabase
    .from("artists")
    .select(
      `
      *,
      artist_music_genres (music_genre_id)
    `,
    )
    .eq("slug", slug)
    .eq("archived", false)
    .single();

  if (error) {
    console.error("Error fetching artist by slug:", error);
    throw new Error("Artist not found");
  }

  return data;
}

export function artistBySlugQuery(slug: string) {
  return queryOptions({
    queryKey: artistsKeys.bySlug(slug),
    queryFn: () => fetchArtistBySlug(slug),
  });
}

export function useArtistBySlugQuery(slug: string) {
  return useQuery({
    ...artistBySlugQuery(slug),
    enabled: !!slug,
  });
}
