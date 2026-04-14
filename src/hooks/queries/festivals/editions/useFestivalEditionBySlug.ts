import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FestivalEdition, editionsKeys } from "./types";
import { fetchFestivalBySlug } from "../useFestivalBySlug";

export async function fetchFestivalEditionBySlug({
  editionSlug,
  festivalSlug,
}: {
  festivalSlug: string;
  editionSlug: string;
}): Promise<FestivalEdition> {
  // First get the festival ID from the slug
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

export function useFestivalEditionBySlugQuery({
  editionSlug,
  festivalSlug,
}: {
  festivalSlug?: string;
  editionSlug?: string;
}) {
  return useQuery({
    queryKey: editionsKeys.bySlug(festivalSlug!, editionSlug!),
    queryFn: () =>
      fetchFestivalEditionBySlug({
        festivalSlug: festivalSlug!,
        editionSlug: editionSlug!,
      }),
    enabled: !!festivalSlug && !!editionSlug,
  });
}
