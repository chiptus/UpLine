import type { Tables } from "@/integrations/supabase/types";

export type SetRating = Tables<"set_ratings">;

export const userRatingsKeys = {
  all: ["ratings"] as const,
  user: (userId: string) => [...userRatingsKeys.all, "user", userId] as const,
};
