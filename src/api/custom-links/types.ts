import type { Tables } from "@/integrations/supabase/types";

export type CustomLink = Tables<"custom_links">;

export const customLinksKeys = {
  all: ["customLinks"] as const,
  byFestival: (festivalId: string) =>
    [...customLinksKeys.all, festivalId] as const,
};
