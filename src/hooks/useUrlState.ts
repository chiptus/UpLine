import { useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { FilterSortSearch } from "@/lib/searchSchemas";

export type FilterSortState = FilterSortSearch;
export type SortOption = FilterSortSearch["sort"];
export type TimelineView = FilterSortSearch["timelineView"];

export function useUrlState() {
  const state = useSearch({ strict: false }) as FilterSortSearch;
  const navigate = useNavigate();

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
      search: (prev) => ({ invite: (prev as FilterSortSearch).invite }),
      replace: true,
    });
  }, [navigate]);

  return { state, updateUrlState, clearFilters };
}
