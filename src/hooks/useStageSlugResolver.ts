import { useQuery } from "@tanstack/react-query";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import {
  resolveStageIdsFromSlugs,
  resolveStageSlugsFromIds,
} from "@/lib/stageSlugs";

export function useStageSlugResolver(editionId: string) {
  const { data: stages = [] } = useQuery(stagesByEditionQuery(editionId));
  return {
    stages,
    resolveIds: (slugs: string[]) => resolveStageIdsFromSlugs(slugs, stages),
    resolveSlugs: (ids: string[]) => resolveStageSlugsFromIds(ids, stages),
  };
}
