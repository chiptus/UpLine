import type { Database } from "@/integrations/supabase/types";
import { festivalsKeys } from "@/api/festivals/types";

export type FestivalEdition =
  Database["public"]["Tables"]["festival_editions"]["Row"];

// Query key factory for festival editions
export const editionsKeys = {
  root: (festivalId: string) =>
    [...festivalsKeys.root(), festivalId, "editions"] as const,
  all: (festivalId: string, { all }: { all?: boolean } = {}) =>
    [...editionsKeys.root(festivalId), { all }] as const,
  item: ({
    editionId,
    festivalId,
  }: {
    festivalId: string;
    editionId: string;
  }) => [...editionsKeys.root(festivalId), editionId] as const,
  bySlug: (festivalId: string, editionSlug: string) =>
    [...editionsKeys.root(festivalId), "slug", editionSlug] as const,
};
