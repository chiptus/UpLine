import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import {
  resolveStageIdsFromSlugs,
  resolveStageSlugsFromIds,
} from "@/lib/stageSlugs";

export function useStageSlugResolver(editionId: string) {
  const { data: stages = [] } = useQuery(stagesByEditionQuery(editionId));
  const resolveIds = useCallback(
    (slugs: string[]) => resolveStageIdsFromSlugs(slugs, stages),
    [stages],
  );
  const resolveSlugs = useCallback(
    (ids: string[]) => resolveStageSlugsFromIds(ids, stages),
    [stages],
  );
  return { stages, resolveIds, resolveSlugs };
}
