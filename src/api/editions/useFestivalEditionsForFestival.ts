import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FestivalEdition, editionsKeys } from "./types";

export async function fetchFestivalEditions(
  festivalId: string,
  { all }: { all?: boolean | undefined } = {},
): Promise<FestivalEdition[]> {
  let query = supabase
    .from("festival_editions")
    .select("*")
    .eq("archived", false)
    .order("year", { ascending: false });

  if (festivalId) {
    query = query.eq("festival_id", festivalId);
  }

  if (!all) {
    query = query.eq("published", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Failed to load festival editions");
  }

  return data || [];
}

export function editionsForFestivalQuery(
  festivalId: string,
  { all }: { all?: boolean | undefined } = {},
) {
  return queryOptions({
    queryKey: editionsKeys.all(festivalId, { all }),
    queryFn: () => fetchFestivalEditions(festivalId, { all }),
  });
}

export function useFestivalEditionsForFestivalQuery(
  festivalId: string | undefined,
  { all }: { all?: boolean | undefined } = {},
) {
  return useQuery({
    ...editionsForFestivalQuery(festivalId!, { all }),
    enabled: !!festivalId,
  });
}
