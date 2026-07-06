import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FestivalInfo, festivalInfoKeys } from "./types";

async function fetchFestivalInfo(
  festivalId: string,
): Promise<FestivalInfo | null> {
  const { data, error } = await supabase
    .from("festival_info")
    .select("*")
    .eq("festival_id", festivalId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching festival info:", error);
    throw new Error("Failed to fetch festival info");
  }

  return data;
}

export function festivalInfoQuery(festivalId: string) {
  return queryOptions({
    queryKey: festivalInfoKeys.byFestival(festivalId),
    queryFn: () => fetchFestivalInfo(festivalId),
  });
}

export function useFestivalInfoQuery(festivalId: string | undefined) {
  return useQuery({
    ...festivalInfoQuery(festivalId!),
    enabled: !!festivalId,
  });
}
