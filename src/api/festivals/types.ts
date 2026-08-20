import type { Database } from "@/integrations/supabase/types";

export type Festival = Database["public"]["Tables"]["festivals"]["Row"];

// Query key factory for festivals
export const festivalsKeys = {
  root: () => ["festivals"] as const,
  all: ({ all }: { all?: boolean | undefined } = {}) =>
    [...festivalsKeys.root(), { all }] as const,
  item: (festivalId: string) => [...festivalsKeys.root(), festivalId] as const,
  bySlug: (festivalSlug: string) =>
    [...festivalsKeys.root(), "slug", festivalSlug] as const,
};
