import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Festival, festivalsKeys } from "./types";
import { timeoutSignal } from "@/lib/timeout";

export async function fetchFestivalBySlug(
  festivalSlug: string,
  signal?: AbortSignal,
): Promise<Festival> {
  try {
    const { data, error } = await supabase
      .from("festivals")
      .select("*")
      .eq("archived", false)
      .eq("slug", festivalSlug)
      .abortSignal(timeoutSignal(signal))
      .single();

    if (error) {
      throw new Error("Failed to load festival");
    }

    return data;
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new Error("Failed to load festival - request timed out");
    }
    throw err;
  }
}

export function festivalBySlugQuery(festivalSlug: string) {
  return queryOptions({
    queryKey: festivalsKeys.bySlug(festivalSlug),
    queryFn: ({ signal }) => fetchFestivalBySlug(festivalSlug, signal),
  });
}

export function useFestivalBySlugQuery(festivalSlug: string | undefined) {
  return useQuery({
    ...festivalBySlugQuery(festivalSlug!),
    enabled: !!festivalSlug,
  });
}
