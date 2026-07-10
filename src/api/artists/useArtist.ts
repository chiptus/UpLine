import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Artist } from "./types";
import { artistsKeys } from "./types";

async function fetchArtist(id: string): Promise<Artist> {
  const { data, error } = await supabase
    .from("artists")
    .select(
      `
      *,
      artist_music_genres (music_genre_id)
    `,
    )
    .eq("id", id)
    .eq("archived", false)
    .single();

  if (error) {
    console.error("Error fetching artist:", error);
    throw new Error("Failed to fetch artist details");
  }

  return data;
}

export function artistQuery(id: string) {
  return queryOptions({
    queryKey: artistsKeys.detail(id),
    queryFn: () => fetchArtist(id),
  });
}
