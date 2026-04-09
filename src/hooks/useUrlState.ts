import { useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { FilterSortSearch } from "@/lib/searchSchemas";

export type FilterSortState = FilterSortSearch;
export type SortOption = FilterSortSearch["sort"];
export type TimelineView = FilterSortSearch["timelineView"];

export function useUrlState(page: "sets" | "set-detail" = "sets") {
  const route =
    page === "sets"
      ? (`/festivals/$festivalSlug/editions/$editionSlug/sets` as const)
      : (`/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug` as const);
  const state = useSearch({ from: route });
  const navigate = useNavigate({ from: route });

  const updateUrlState = useCallback(
    (updates: Partial<FilterSortSearch>) => {
      navigate({
        to: ".",
        search: (prev: FilterSortSearch) => ({ ...prev, ...updates }),
        replace: true,
      });
    },
    [navigate],
  );

  const clearFilters = useCallback(() => {
    navigate({
      to: ".",
      search: (prev: FilterSortSearch) => ({ invite: prev.invite }),
      replace: true,
    });
  }, [navigate]);

  return { state, updateUrlState, clearFilters };
}
