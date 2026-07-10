import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FestivalInfo, festivalInfoKeys } from "./types";

async function fetchFestivalInfos(): Promise<FestivalInfo[]> {
  const { data, error } = await supabase.from("festival_info").select("*");

  if (error) {
    console.error("Error fetching festival infos:", error);
    throw new Error("Failed to fetch festival infos");
  }

  return data;
}

export function festivalInfosQuery() {
  return queryOptions({
    queryKey: festivalInfoKeys.all,
    queryFn: fetchFestivalInfos,
  });
}

export function useFestivalInfosQuery() {
  return useQuery(festivalInfosQuery());
}
