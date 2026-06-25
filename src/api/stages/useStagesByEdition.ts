import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Stage } from "./types";
import { stagesKeys } from "./types";
import { sortStagesByOrder } from "@/lib/stageUtils";

export async function fetchStagesByEdition(
  editionId: string,
): Promise<Stage[]> {
  const { data, error } = await supabase
    .from("stages")
    .select("*")
    .eq("festival_edition_id", editionId)
    .eq("archived", false)
    .order("name");

  if (error) {
    throw new Error("Failed to load stages for edition");
  }

  return sortStagesByOrder(data || []);
}

export function stagesByEditionQuery(editionId: string) {
  return queryOptions({
    queryKey: stagesKeys.byEdition(editionId),
    queryFn: () => fetchStagesByEdition(editionId),
  });
}

export function useStagesByEditionQuery(editionId: string | undefined) {
  return useQuery({
    ...stagesByEditionQuery(editionId!),
    enabled: !!editionId,
  });
}
