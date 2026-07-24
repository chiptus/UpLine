import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { userRatingsKeys } from "./types";

async function fetchUserRatings(
  userId: string,
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("set_ratings")
    .select("set_id, rating")
    .eq("user_id", userId);

  if (error) {
    throw new Error("Failed to fetch user ratings");
  }

  const ratings: Record<string, number> = {};

  (data || []).forEach((rating) => {
    ratings[rating.set_id] = rating.rating;
  });

  return ratings;
}

export function userRatingsQuery(userId: string) {
  return queryOptions({
    queryKey: userRatingsKeys.user(userId),
    queryFn: () => fetchUserRatings(userId),
  });
}

export function useUserRatings(userId: string | undefined) {
  return useQuery({
    ...userRatingsQuery(userId!),
    enabled: !!userId,
  });
}
