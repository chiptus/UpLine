import type { Database } from "@/integrations/supabase/types";

export type FestivalEdition =
  Database["public"]["Tables"]["festival_editions"]["Row"];

// Query key factory for festival editions
export const editionsKeys = {
  all: (festivalId: string) => ["festivals", festivalId, "editions"] as const,
  item: ({
    editionId,
    festivalId,
  }: {
    festivalId: string;
    editionId: string;
  }) => ["festivals", festivalId, "editions", editionId] as const,
  bySlug: (festivalSlug: string, editionSlug: string) =>
    ["festival-editions", "slug", festivalSlug, editionSlug] as const,
};
