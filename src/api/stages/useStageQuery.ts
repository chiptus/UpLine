import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Stage } from "./types";
import { stagesKeys } from "./types";

export async function fetchStage(stageId: string): Promise<Stage | null> {
  const { data, error } = await supabase
    .from("stages")
    .select("*")
    .eq("id", stageId)
    .eq("archived", false)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error("Failed to load stage");
  }

  return data;
}

export function stageQuery(stageId: string) {
  return queryOptions({
    queryKey: stagesKeys.byId(stageId),
    queryFn: () => fetchStage(stageId),
  });
}

export function useStageQuery(stageId: string | undefined | null) {
  return useQuery({
    ...stageQuery(stageId ?? ""),
    enabled: !!stageId,
  });
}
