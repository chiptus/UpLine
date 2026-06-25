import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FestivalSet, setsKeys } from "./types";

// Business logic function
async function fetchSets(): Promise<FestivalSet[]> {
  const { data, error } = await supabase
    .from("sets")
    .select(
      `
      *,
      set_artists (
        artists (
          *,
          artist_music_genres (
            music_genre_id
          )
        )
      ),
      votes (vote_type, user_id)
    `,
    )
    .eq("archived", false)
    .order("time_start", { ascending: true });

  if (error) {
    console.error("Error fetching sets:", error);
    throw new Error("Failed to fetch sets");
  }

  // Transform the data to match expected structure
  const transformedData =
    data?.map((set) => ({
      ...set,
      artists:
        set.set_artists
          ?.map((sa) => ({
            ...sa.artists,
          }))
          .filter(Boolean) || [],
      set_artists: undefined, // Remove junction data from final response
    })) || [];

  return transformedData;
}

export function setsQuery() {
  return queryOptions({
    queryKey: setsKeys.lists(),
    queryFn: fetchSets,
  });
}

export function useSetsQuery() {
  return useQuery(setsQuery());
}
