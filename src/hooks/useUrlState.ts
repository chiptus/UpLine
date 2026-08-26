import { useCallback, useMemo } from "react";
import {
  useNavigate,
  useSearch,
  useRouteContext,
} from "@tanstack/react-router";
import { type FilterSortSearch } from "@/lib/searchSchemas";
import { useStageSlugResolver } from "@/hooks/useStageSlugResolver";

export type FilterSortState = Omit<FilterSortSearch, "stages"> & {
  stages: string[];
};
export type SortOption = FilterSortSearch["sort"];
export type TimelineView = FilterSortSearch["timelineView"];

export function useUrlState() {
  const { edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });
  const { resolveIds, resolveSlugs } = useStageSlugResolver(edition.id);
  const search = useSearch({
    from: "/festivals/$festivalSlug/editions/$editionSlug/sets",
  });
  const state = useMemo(
    () => ({
      ...search,
      stages: resolveIds(search.stages),
    }),
    [search, resolveIds],
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
      search: (prev) => ({
        invite: prev.invite,
      }),
      replace: true,
    });
  }, [navigate]);

  return { state, updateUrlState, clearFilters };
}
