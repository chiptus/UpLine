import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { artistsKeys } from "./types";

interface ArtistSlugTakenParams {
  slug: string;
  excludeArtistId: string;
}

export function artistSlugTakenQuery(params: ArtistSlugTakenParams) {
  return queryOptions({
    queryKey: artistsKeys.slugTaken(params),
    queryFn: ({ signal }) => fetchArtistSlugTaken(params, signal),
  });
}

/** Artist slugs are globally unique. */
export function useArtistSlugTakenQuery(
  params: ArtistSlugTakenParams,
  options: { enabled?: boolean } = {},
) {
  return useQuery({ ...artistSlugTakenQuery(params), ...options });
}

async function fetchArtistSlugTaken(
  params: ArtistSlugTakenParams,
  signal: AbortSignal,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("artists")
    .select("id", { count: "exact", head: true })
    .eq("slug", params.slug)
    .neq("id", params.excludeArtistId)
    .abortSignal(signal);

  if (error) {
    console.error("Error checking artist slug:", error);
    throw new Error("Failed to check slug availability");
  }

  return (count ?? 0) > 0;
}
