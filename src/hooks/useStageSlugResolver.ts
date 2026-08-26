import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import type { Stage } from "@/api/stages/types";
import {
  resolveStageIdsFromSlugs,
  resolveStageSlugsFromIds,
} from "@/lib/stageSlugs";

const EMPTY_STAGES: Stage[] = [];

export function useStageSlugResolver(editionId: string) {
  const { data: stages = EMPTY_STAGES } = useQuery(
    stagesByEditionQuery(editionId),
  );
  const resolveIds = useCallback(
    (slugs: string[]) => resolveStageIdsFromSlugs(slugs, stages),
    [stages],
  );
  const resolveSlugs = useCallback(
    (ids: string[]) => resolveStageSlugsFromIds(ids, stages),
    [stages],
  );
  return { resolveIds, resolveSlugs };
}
