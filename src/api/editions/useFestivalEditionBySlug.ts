import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FestivalEdition, editionsKeys } from "./types";
import { isTimeoutError, withTimeout } from "@/lib/timeout";
import {
  isSupabaseNotFoundError,
  SupabaseNotFoundError,
} from "@/lib/supabaseErrors";

export async function fetchFestivalEditionBySlug({
  editionSlug,
  festivalId,
  signal,
}: {
  editionSlug: string;
  festivalId: string;
  signal?: AbortSignal;
}): Promise<FestivalEdition> {
  const { data, error } = await supabase
    .from("festival_editions")
    .select("*")
    .eq("archived", false)
    .eq("festival_id", festivalId)
    .eq("slug", editionSlug)
    .abortSignal(signal!)
    .single();

  if (error) {
    if (isTimeoutError(signal)) {
      throw new Error("Failed to load festival edition - request timed out");
    }
    if (isSupabaseNotFoundError(error)) {
      throw new SupabaseNotFoundError("Festival edition");
    }
    throw new Error("Failed to load festival edition");
  }

  return data;
}

export function editionBySlugQuery({
  editionSlug,
  festivalId,
  timeoutMs = 10000,
}: {
  editionSlug: string;
  festivalId: string;
  timeoutMs?: number;
}) {
  return queryOptions({
    queryKey: editionsKeys.bySlug(festivalId, editionSlug),
    queryFn: ({ signal }) =>
      fetchFestivalEditionBySlug({
        festivalId,
        editionSlug,
        signal: withTimeout(signal, timeoutMs),
      }),
  });
}

export function useFestivalEditionBySlugQuery({
  editionSlug,
  festivalId,
}: {
  editionSlug?: string;
  festivalId?: string;
}) {
  return useQuery({
    ...editionBySlugQuery({
      festivalId: festivalId!,
      editionSlug: editionSlug!,
    }),
    enabled: !!festivalId && !!editionSlug,
  });
}
