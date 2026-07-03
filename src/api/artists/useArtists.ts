import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Artist } from "./types";
import { artistsKeys } from "./types";

async function fetchArtists(): Promise<Artist[]> {
  const { data, error } = await supabase
    .from("artists")
    .select(
      `
      *,
      artist_music_genres (music_genre_id)
    `,
    )
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching artists:", error);
    throw new Error("Failed to fetch artists");
  }

  const { data: soundcloudData, error: soundcloudError } = await supabase
    .from("soundcloud")
    .select("artist_id, followers_count");

  if (soundcloudError) {
    console.error("Error fetching soundcloud data:", soundcloudError);
    throw new Error("Failed to fetch soundcloud data");
  }

  const soundcloudMap = new Map(
    soundcloudData?.map((sc) => [sc.artist_id, sc.followers_count]) || [],
  );

  return (
    data.map((artist) => {
      return {
        ...artist,
        soundcloud_followers: soundcloudMap.get(artist.id) || 0,
      };
    }) || []
  );
}

export function artistsQuery() {
  return queryOptions({
    queryKey: artistsKeys.lists(),
    queryFn: fetchArtists,
  });
}

export function useArtistsQuery() {
  return useQuery(artistsQuery());
}
