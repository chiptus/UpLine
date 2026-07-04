import type { Database } from "@/integrations/supabase/types";
import type { Artist } from "@/api/artists/types";

export type FestivalSet = Database["public"]["Tables"]["sets"]["Row"] & {
  artists: Artist[];
  votes: { vote_type: number; user_id: string }[];
  stage_name?: string | null;
};

export type Stage = Database["public"]["Tables"]["stages"]["Row"];

export const setsKeys = {
  all: ["sets"] as const,
  lists: () => [...setsKeys.all, "list"] as const,
  list: (filters?: unknown) => [...setsKeys.lists(), filters] as const,
  details: () => [...setsKeys.all, "detail"] as const,
  detail: (id: string) => [...setsKeys.details(), id] as const,
  bySlug: (params: unknown) => [...setsKeys.details(), params] as const,
  byEdition: (editionId: string) =>
    [...setsKeys.all, "edition", editionId] as const,
};
