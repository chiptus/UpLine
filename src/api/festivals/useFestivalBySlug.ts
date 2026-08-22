import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Festival, festivalsKeys } from "./types";
import { isTimeoutError, withTimeout } from "@/lib/timeout";

export class FestivalNotFoundError extends Error {
  constructor() {
    super("Festival not found");
    this.name = "FestivalNotFoundError";
  }
}

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
    if (error.code === "PGRST116") {
      throw new FestivalNotFoundError();
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
