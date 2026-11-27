import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { editionsKeys } from "./types";

interface EditionSlugTakenParams {
  festivalId: string;
  slug: string;
  excludeEditionId: string;
}

export function editionSlugTakenQuery(params: EditionSlugTakenParams) {
  return queryOptions({
    queryKey: editionsKeys.slugTaken(params.festivalId, params),
    queryFn: ({ signal }) => fetchEditionSlugTaken(params, signal),
  });
}

/** Edition slugs only need to be unique within their festival. */
export function useEditionSlugTakenQuery(
  params: EditionSlugTakenParams,
  options: { enabled?: boolean } = {},
) {
  return useQuery({ ...editionSlugTakenQuery(params), ...options });
}

async function fetchEditionSlugTaken(
  params: EditionSlugTakenParams,
  signal: AbortSignal,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("festival_editions")
    .select("id", { count: "exact", head: true })
    .eq("festival_id", params.festivalId)
    .eq("slug", params.slug)
    .neq("id", params.excludeEditionId)
    .abortSignal(signal);

  if (error) {
    console.error("Error checking edition slug:", error);
    throw new Error("Failed to check slug availability");
  }

  return (count ?? 0) > 0;
}
