import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FestivalSet, setsKeys } from "./types";
import { fetchFestivalEditionBySlug } from "@/api/editions/useFestivalEditionBySlug";

async function fetchSetBySlug({
  festivalSlug,
  editionSlug,
  slug,
}: {
  festivalSlug: string;
  editionSlug: string;
  slug: string;
}): Promise<FestivalSet> {
  const edition = await fetchFestivalEditionBySlug({ festivalSlug, editionSlug });

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
    .eq("festival_edition_id", edition.id)
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

export function setBySlugQuery({
  festivalSlug,
  editionSlug,
  slug,
}: {
  festivalSlug: string;
  editionSlug: string;
  slug: string;
}) {
  return queryOptions({
    queryKey: setsKeys.bySlug({ festivalSlug, editionSlug, slug }),
    queryFn: () => fetchSetBySlug({ festivalSlug, editionSlug, slug }),
  });
}

export function useSetBySlugQuery({
  festivalSlug,
  editionSlug,
  slug,
}: {
  festivalSlug?: string;
  editionSlug?: string;
  slug?: string;
} = {}) {
  return useQuery({
    ...setBySlugQuery({
      festivalSlug: festivalSlug!,
      editionSlug: editionSlug!,
      slug: slug!,
    }),
    enabled: !!festivalSlug && !!editionSlug && !!slug,
  });
}
