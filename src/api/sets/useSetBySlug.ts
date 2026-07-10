import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FestivalSet, setsKeys } from "./types";

async function fetchSetBySlug({
  slug,
  editionId,
}: {
  slug: string;
  editionId: string;
}): Promise<FestivalSet> {
  const { data, error } = await supabase
    .from("sets")
    .select(
      `
      *,
      stages (name),
      set_artists!inner (
        artists (
          *,
          artist_music_genres (music_genre_id)
        )
      ),
      votes (vote_type, user_id)
    `,
    )
    .eq("slug", slug)
    .eq("festival_edition_id", editionId)
    .eq("archived", false)
    .single();

  if (error) {
    console.error("Error fetching set by slug:", error);
    throw new Error("Set not found");
  }

  // Transform to expected format
  const transformedData: FestivalSet = {
    ...data,
    artists:
      data.set_artists
        ?.map((sa) => ({
          ...sa.artists,
          artist_music_genres: sa.artists?.artist_music_genres || [],
          votes: [],
        }))
        .filter(Boolean) || [],
    votes: data.votes || [],
  };

  return transformedData;
}

export function setBySlugQuery(slug: string, editionId: string) {
  return queryOptions({
    queryKey: setsKeys.bySlug({ slug, editionId }),
    queryFn: () => fetchSetBySlug({ slug, editionId }),
  });
}
