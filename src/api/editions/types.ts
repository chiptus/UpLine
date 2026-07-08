import type { Database } from "@/integrations/supabase/types";

export type FestivalEdition =
  Database["public"]["Tables"]["festival_editions"]["Row"];

// Query key factory for festival editions
export const editionsKeys = {
  root: (festivalId: string) => ["festivals", festivalId, "editions"] as const,
  all: (festivalId: string, { all }: { all?: boolean } = {}) =>
    [...editionsKeys.root(festivalId), { all }] as const,
  item: ({
    editionId,
    festivalId,
  }: {
    festivalId: string;
    editionId: string;
  }) => [...editionsKeys.root(festivalId), editionId] as const,
  bySlugRoot: () => ["festival-editions"] as const,
  bySlug: (festivalSlug: string, editionSlug: string) =>
    [...editionsKeys.bySlugRoot(), "slug", festivalSlug, editionSlug] as const,
};
