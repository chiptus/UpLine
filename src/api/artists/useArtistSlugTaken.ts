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
  params: ArtistSlugTakenParams & { enabled: boolean },
) {
  const { enabled, ...rest } = params;
  return useQuery({ ...artistSlugTakenQuery(rest), enabled });
}

async function fetchArtistSlugTaken(
  params: ArtistSlugTakenParams,
  signal: AbortSignal,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("artists")
    .select("id")
    .eq("slug", params.slug)
    .neq("id", params.excludeArtistId)
    .limit(1)
    .abortSignal(signal);

  if (error) {
    console.error("Error checking artist slug:", error);
    throw new Error("Failed to check slug availability");
  }

  return data.length > 0;
}
