import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { setsKeys } from "./types";

interface SetSlugTakenParams {
  editionId: string;
  slug: string;
  excludeSetId: string;
}

export function setSlugTakenQuery(params: SetSlugTakenParams) {
  return queryOptions({
    queryKey: setsKeys.slugTaken(params),
    queryFn: ({ signal }) => fetchSetSlugTaken(params, signal),
  });
}

/** Sets are unique per edition, so the check is scoped to it. */
export function useSetSlugTakenQuery(
  params: SetSlugTakenParams,
  options: { enabled?: boolean } = {},
) {
  return useQuery({ ...setSlugTakenQuery(params), ...options });
}

async function fetchSetSlugTaken(
  params: SetSlugTakenParams,
  signal: AbortSignal,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("sets")
    .select("id", { count: "exact", head: true })
    .eq("festival_edition_id", params.editionId)
    .eq("slug", params.slug)
    .neq("id", params.excludeSetId)
    .abortSignal(signal);

  if (error) {
    console.error("Error checking set slug:", error);
    throw new Error("Failed to check slug availability");
  }

  return (count ?? 0) > 0;
}
