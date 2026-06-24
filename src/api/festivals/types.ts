import type { Database } from "@/integrations/supabase/types";

export type Festival = Database["public"]["Tables"]["festivals"]["Row"];

// Query key factory for festivals
export const festivalsKeys = {
  all: () => ["festivals"] as const,
  item: (festivalId: string) => ["festivals", festivalId] as const,
  bySlug: (festivalSlug: string) =>
    ["festivals", "slug", festivalSlug] as const,
};
