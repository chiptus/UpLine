import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FestivalEdition, editionsKeys } from "./types";
import { fetchFestivalBySlug } from "@/api/festivals/useFestivalBySlug";
import { isTimeoutError, withTimeout } from "@/lib/timeout";

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

  const { data, error } = await supabase
    .from("festival_editions")
    .select("*")
    .eq("archived", false)
    .eq("festival_id", festival.id)
    .eq("slug", editionSlug)
    .abortSignal(signal!)
    .single();

  if (error) {
    if (isTimeoutError(signal)) {
      throw new Error("Failed to load festival edition - request timed out");
    }
    throw new Error("Failed to load festival edition");
  }

  return data;
}

export function editionBySlugQuery({
  editionSlug,
  festivalSlug,
  timeoutMs = 10000,
}: {
  festivalSlug: string;
  editionSlug: string;
  timeoutMs?: number;
}) {
  return queryOptions({
    queryKey: editionsKeys.bySlug(festivalSlug, editionSlug),
    queryFn: ({ signal }) =>
      fetchFestivalEditionBySlug({
        festivalSlug,
        editionSlug,
        signal: withTimeout(signal, timeoutMs),
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
