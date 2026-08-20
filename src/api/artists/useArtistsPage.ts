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
  const { data, error } = await supabase.rpc("get_artists_page", {
    p_page: page,
    p_page_size: pageSize,
    p_search: search.trim() || undefined,
    p_sort_key: sortKey,
    p_sort_dir: sortDir,
  });

  if (error) {
    console.error("Error fetching artists page:", error);
    throw new Error("Failed to fetch artists");
  }

  const rows = data ?? [];
  const artistIds = rows.map((row) => (row.artist as { id: string }).id);

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
    artists: rows.map((row) => {
      const artist = row.artist as Artist;
      const genreIds = row.genre_ids as string[];
      return {
        ...artist,
        artist_music_genres: genreIds.map((id) => ({ music_genre_id: id })),
        soundcloud_followers: soundcloudMap.get(artist.id) || 0,
      };
    }),
    totalCount: rows.length > 0 ? Number(rows[0].total_count) : 0,
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
