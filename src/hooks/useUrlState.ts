import { useCallback, useMemo } from "react";
import {
  useNavigate,
  useSearch,
  useRouteContext,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { type FilterSortSearch } from "@/lib/searchSchemas";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import {
  resolveStageIdsFromSlugs,
  resolveStageSlugsFromIds,
} from "@/lib/stageSlugs";

export type FilterSortState = Omit<FilterSortSearch, "stages"> & {
  stages: string[];
};
export type SortOption = FilterSortSearch["sort"];
export type TimelineView = FilterSortSearch["timelineView"];

export function useUrlState() {
  const { edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });
  const { data: stages = [] } = useQuery(stagesByEditionQuery(edition.id));
  const search = useSearch({
    from: "/festivals/$festivalSlug/editions/$editionSlug/sets",
  });
  const state = useMemo(
    () => ({
      ...search,
      stages: resolveStageIdsFromSlugs(search.stages, stages),
    }),
    [search, stages],
  );
  const navigate = useNavigate({
    from: "/festivals/$festivalSlug/editions/$editionSlug/sets",
  });

  const updateUrlState = useCallback(
    (updates: Partial<FilterSortState>) => {
      const { stages: updatedStageIds, ...rest } = updates;
      navigate({
        to: ".",
        search: (prev) => ({
          ...prev,
          ...rest,
          ...(updatedStageIds
            ? { stages: resolveStageSlugsFromIds(updatedStageIds, stages) }
            : {}),
        }),
        replace: true,
      });
    },
    [navigate, stages],
  );

  const clearFilters = useCallback(() => {
    navigate({
      to: ".",
      search: (prev) => ({
        invite: prev.invite,
      }),
      replace: true,
    });
  }, [navigate]);

  return { state, updateUrlState, clearFilters };
}
