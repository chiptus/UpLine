import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FestivalEdition, editionsKeys } from "./types";

export async function fetchFestivalEdition({
  editionId,
  festivalId,
}: {
  festivalId: string;
  editionId: string;
}): Promise<FestivalEdition> {
  const query = supabase
    .from("festival_editions")
    .select("*")
    .eq("archived", false)
    .eq("festival_id", festivalId)
    .eq("id", editionId)
    .single();

  const { data, error } = await query;

  if (error) {
    throw new Error("Failed to load festival edition");
  }

  return data;
}

export function editionQuery({
  editionId,
  festivalId,
}: {
  festivalId: string;
  editionId: string;
}) {
  return queryOptions({
    queryKey: editionsKeys.item({
      festivalId,
      editionId,
    }),
    queryFn: () =>
      fetchFestivalEdition({
        festivalId,
        editionId,
      }),
  });
}

export function useFestivalEditionQuery({
  editionId,
  festivalId,
}: {
  festivalId?: string;
  editionId?: string;
}) {
  return useQuery({
    ...editionQuery({
      festivalId: festivalId!,
      editionId: editionId!,
    }),
    enabled: !!festivalId && !!editionId,
  });
}
