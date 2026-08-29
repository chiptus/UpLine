import { useCallback } from "react";
import {
  useNavigate,
  useSearch,
  useRouteContext,
} from "@tanstack/react-router";
import { type FilterSortSearch } from "@/lib/searchSchemas";
import { useStageSlugResolver } from "@/hooks/useStageSlugResolver";

export type FilterSortState = Omit<FilterSortSearch, "stages"> & {
  stagesIds: string[];
};
export type SortOption = FilterSortSearch["sort"];
export type TimelineView = FilterSortSearch["timelineView"];

export function useUrlState() {
  const { edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });
  const { resolveIds, resolveSlugs } = useStageSlugResolver(edition.id);
  const state = useSearch({
    from: "/festivals/$festivalSlug/editions/$editionSlug/sets",
    select: (search) => ({
      ...search,
      stagesIds: resolveIds(search.stages),
    }),
  });
  const navigate = useNavigate({
    from: "/festivals/$festivalSlug/editions/$editionSlug/sets",
  });

  const updateUrlState = useCallback(
    (updates: Partial<FilterSortState>) => {
      const { stagesIds: updatedStageIds, ...rest } = updates;
      navigate({
        to: ".",
        search: (prev) => ({
          ...prev,
          ...rest,
          ...(updatedStageIds ? { stages: resolveSlugs(updatedStageIds) } : {}),
        }),
        replace: true,
      });
    },
    [navigate, resolveSlugs],
  );

  const clearFilters = useCallback(() => {
    navigate({
      to: ".",
      search: {},
      replace: true,
    });
  }, [navigate]);

  return { state, updateUrlState, clearFilters };
}
