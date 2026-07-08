import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FestivalEdition, editionsKeys } from "./types";
import { fetchFestivalBySlug } from "@/api/festivals/useFestivalBySlug";
import { timeoutSignal } from "@/lib/timeout";

export async function fetchFestivalEditionBySlug({
  editionSlug,
  festivalSlug,
  signal,
}: {
  festivalSlug: string;
  editionSlug: string;
  signal?: AbortSignal;
}): Promise<FestivalEdition> {
  const festival = await fetchFestivalBySlug(festivalSlug, signal);

  try {
    const { data, error } = await supabase
      .from("festival_editions")
      .select("*")
      .eq("archived", false)
      .eq("festival_id", festival.id)
      .eq("slug", editionSlug)
      .abortSignal(timeoutSignal(signal))
      .single();

    if (error) {
      throw new Error("Failed to load festival edition");
    }

    return data;
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new Error("Failed to load festival edition - request timed out");
    }
    throw err;
  }
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
    queryFn: ({ signal }) =>
      fetchFestivalEditionBySlug({
        festivalSlug,
        editionSlug,
        signal,
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
