import { useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { type FilterSortSearch } from "@/lib/searchSchemas";

export type FilterSortState = FilterSortSearch;
export type SortOption = FilterSortSearch["sort"];
export type TimelineView = FilterSortSearch["timelineView"];

export function useUrlState() {
  const search = useSearch({
    from: "/festivals/$festivalSlug/editions/$editionSlug/sets",
  });
  const navigate = useNavigate({
    from: "/festivals/$festivalSlug/editions/$editionSlug/sets",
  });

  const updateUrlState = useCallback(
    (updates: Partial<FilterSortSearch>) => {
      navigate({
        to: ".",
        search: (prev) => ({ ...prev, ...updates }),
        replace: true,
      });
    },
    [navigate],
  );

  const clearFilters = useCallback(() => {
    navigate({
      to: ".",
      search: (prev) => ({
        invite: prev.invite,
        groupId: prev.groupId,
        votePerspective: prev.votePerspective,
      }),
      replace: true,
    });
  }, [navigate]);

  return { state: search, updateUrlState, clearFilters };
}
