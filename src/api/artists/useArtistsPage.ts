import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AdminArtistsSortKey } from "@/lib/searchSchemas";
import type { Artist } from "./types";
import { artistsKeys } from "./types";

export interface ArtistsPageParams {
  page: number;
  pageSize: number;
  search: string;
  sortKey: AdminArtistsSortKey;
  sortDir: "asc" | "desc";
}

interface ArtistsPageResult {
  artists: Artist[];
  totalCount: number;
}

async function fetchArtistsPage({
  page,
  pageSize,
  search,
  sortKey,
  sortDir,
}: ArtistsPageParams): Promise<ArtistsPageResult> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("artists")
    .select(
      `
      *,
      artist_music_genres (music_genre_id)
    `,
      { count: "exact" },
    )
    .eq("archived", false);

  if (search.trim()) {
    query = query.ilike("name", `%${search.trim()}%`);
  }

  const { data, error, count } = await query
    .order(sortKey, { ascending: sortDir === "asc" })
    .order("id")
    .range(from, to);

  if (error) {
    console.error("Error fetching artists page:", error);
    throw new Error("Failed to fetch artists");
  }

  const artistIds = data.map((artist) => artist.id);

  const soundcloudMap = new Map<string, number>();
  if (artistIds.length > 0) {
    const { data: soundcloudData, error: soundcloudError } = await supabase
      .from("soundcloud")
      .select("artist_id, followers_count")
      .in("artist_id", artistIds);

    if (soundcloudError) {
      console.error("Error fetching soundcloud data:", soundcloudError);
      throw new Error("Failed to fetch soundcloud data");
    }

    for (const sc of soundcloudData ?? []) {
      soundcloudMap.set(sc.artist_id, sc.followers_count ?? 0);
    }
  }

  return {
    artists: data.map((artist) => ({
      ...artist,
      soundcloud_followers: soundcloudMap.get(artist.id) || 0,
    })),
    totalCount: count ?? 0,
  };
}

export function artistsPageQuery(params: ArtistsPageParams) {
  return queryOptions({
    queryKey: artistsKeys.list(params),
    queryFn: () => fetchArtistsPage(params),
  });
}

export function useArtistsPageQuery(params: ArtistsPageParams) {
  return useQuery(artistsPageQuery(params));
}
