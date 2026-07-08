import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Festival, festivalsKeys } from "./types";
import { withTimeout } from "@/lib/timeout";

export async function fetchFestivalBySlug(
  festivalSlug: string,
): Promise<Festival> {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from("festivals")
        .select("*")
        .eq("archived", false)
        .eq("slug", festivalSlug)
        .single(),
      10000,
    );

    if (error) {
      throw new Error("Failed to load festival");
    }

    return data;
  } catch (err) {
    if (err instanceof Error && err.message === "Request timeout") {
      throw new Error("Failed to load festival - request timed out");
    }
    throw err;
  }
}

export function festivalBySlugQuery(festivalSlug: string) {
  return queryOptions({
    queryKey: festivalsKeys.bySlug(festivalSlug),
    queryFn: () => fetchFestivalBySlug(festivalSlug),
  });
}

export function useFestivalBySlugQuery(festivalSlug: string | undefined) {
  return useQuery({
    ...festivalBySlugQuery(festivalSlug!),
    enabled: !!festivalSlug,
  });
}
