import type { Database } from "@/integrations/supabase/types";

export type Artist = Database["public"]["Tables"]["artists"]["Row"] & {
  artist_music_genres: { music_genre_id: string }[] | null;
  soundcloud_followers?: number;
};

export const artistsKeys = {
  all: ["artists"] as const,
  lists: () => [...artistsKeys.all, "list"] as const,
  list: (filters?: unknown) => [...artistsKeys.lists(), filters] as const,
  details: () => [...artistsKeys.all, "detail"] as const,
  detail: (id: string) => [...artistsKeys.details(), id] as const,
  bySlug: (slug: string) => [...artistsKeys.details(), "slug", slug] as const,
};
