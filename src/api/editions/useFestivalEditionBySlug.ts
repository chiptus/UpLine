import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FestivalEdition, editionsKeys } from "./types";
import { fetchFestivalBySlug } from "@/api/festivals/useFestivalBySlug";

export async function fetchFestivalEditionBySlug({
  editionSlug,
  festivalSlug,
}: {
  festivalSlug: string;
  editionSlug: string;
}): Promise<FestivalEdition> {
  const festival = await fetchFestivalBySlug(festivalSlug);

  const query = supabase
    .from("festival_editions")
    .select("*")
    .eq("archived", false)
    .eq("festival_id", festival.id)
    .eq("slug", editionSlug)
    .single();

  const { data, error } = await query;

  if (error) {
    throw new Error("Failed to load festival edition");
  }

  return data;
}

export function editionBySlugQuery({
  editionSlug,
  festivalSlug,
}: {
  festivalSlug: string;
  editionSlug: string;
}) {
  return queryOptions({
    queryKey: editionsKeys.bySlug(festivalSlug, editionSlug),
    queryFn: () =>
      fetchFestivalEditionBySlug({
        festivalSlug,
        editionSlug,
      }),
  });
}

export function useFestivalEditionBySlugQuery({
  editionSlug,
  festivalSlug,
}: {
  festivalSlug?: string;
  editionSlug?: string;
}) {
  return useQuery({
    ...editionBySlugQuery({
      festivalSlug: festivalSlug!,
      editionSlug: editionSlug!,
    }),
    enabled: !!festivalSlug && !!editionSlug,
  });
}
