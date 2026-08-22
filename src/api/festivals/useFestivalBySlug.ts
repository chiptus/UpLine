import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Festival, festivalsKeys } from "./types";
import { isTimeoutError, withTimeout } from "@/lib/timeout";
import {
  isSupabaseNotFoundError,
  SupabaseNotFoundError,
} from "@/lib/supabaseErrors";

export async function fetchFestivalBySlug(
  festivalSlug: string,
  signal?: AbortSignal,
): Promise<Festival> {
  const { data, error } = await supabase
    .from("festivals")
    .select("*")
    .eq("archived", false)
    .eq("slug", festivalSlug)
    .abortSignal(signal!)
    .single();

  if (error) {
    if (isTimeoutError(signal)) {
      throw new Error("Failed to load festival - request timed out");
    }
    if (isSupabaseNotFoundError(error)) {
      throw new SupabaseNotFoundError("Festival");
    }
    throw new Error("Failed to load festival");
  }

  return data;
}

export function festivalBySlugQuery(
  festivalSlug: string,
  { timeoutMs = 10000 }: { timeoutMs?: number } = {},
) {
  return queryOptions({
    queryKey: festivalsKeys.bySlug(festivalSlug),
    queryFn: ({ signal }) =>
      fetchFestivalBySlug(festivalSlug, withTimeout(signal, timeoutMs)),
  });
}

export function useFestivalBySlugQuery(festivalSlug: string | undefined) {
  return useQuery({
    ...festivalBySlugQuery(festivalSlug!),
    enabled: !!festivalSlug,
  });
}
