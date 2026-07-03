import type { Tables } from "@/integrations/supabase/types";

export type FestivalInfo = Tables<"festival_info">;

export const festivalInfoKeys = {
  all: ["festivalInfo"] as const,
  byFestival: (festivalId: string) =>
    [...festivalInfoKeys.all, festivalId] as const,
};
