import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { festivalsKeys } from "./types";

interface FestivalSlugTakenParams {
  slug: string;
  excludeFestivalId: string;
}

export function festivalSlugTakenQuery(params: FestivalSlugTakenParams) {
  return queryOptions({
    queryKey: festivalsKeys.slugTaken(params),
    queryFn: ({ signal }) => fetchFestivalSlugTaken(params, signal),
  });
}

/** Festival slugs are globally unique. */
export function useFestivalSlugTakenQuery(
  params: FestivalSlugTakenParams,
  options: { enabled?: boolean } = {},
) {
  return useQuery({ ...festivalSlugTakenQuery(params), ...options });
}

async function fetchFestivalSlugTaken(
  params: FestivalSlugTakenParams,
  signal: AbortSignal,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("festivals")
    .select("id", { count: "exact", head: true })
    .eq("slug", params.slug)
    .neq("id", params.excludeFestivalId)
    .abortSignal(signal);

  if (error) {
    console.error("Error checking festival slug:", error);
    throw new Error("Failed to check slug availability");
  }

  return (count ?? 0) > 0;
}
