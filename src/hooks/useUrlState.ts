import { useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { FilterSortSearch } from "@/lib/searchSchemas";

export type SortOption =
  | "name-asc"
  | "name-desc"
  | "rating-desc"
  | "popularity-desc"
  | "date-asc";
export type TimelineView = "horizontal" | "list";
export type MainTab = "artists" | "timeline" | "map" | "info" | "social";

export interface FilterSortState {
  sort: SortOption;
  stages: string[];
  genres: string[];
  minRating: number;
  timelineView: TimelineView;
  use24Hour: boolean;
  groupId?: string;
  invite?: string;
  sortLocked?: boolean;
  votePerspective?: string;
}

const defaultState: FilterSortState = {
  sort: "popularity-desc",
  stages: [],
  genres: [],
  minRating: 0,
  timelineView: "list",
  use24Hour: true,
  groupId: undefined,
  invite: undefined,
  sortLocked: false,
  votePerspective: undefined,
};

export function useUrlState() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false });

  const getStateFromUrl = useCallback((): FilterSortState => {
    const searchParams = search as {
      sort?: string;
      stages?: string;
      genres?: string;
      minRating?: string;
      timelineView?: string;
      use24Hour?: string;
      groupId?: string;
      invite?: string;
      sortLocked?: string;
      votePerspective?: string;
    };

    return {
      sort: (searchParams.sort as SortOption) || defaultState.sort,
      stages:
        searchParams.stages?.split(",").filter(Boolean) || defaultState.stages,
      genres:
        searchParams.genres?.split(",").filter(Boolean) || defaultState.genres,
      minRating:
        parseInt(searchParams.minRating || "0") || defaultState.minRating,
      timelineView:
        (searchParams.timelineView as TimelineView) ||
        defaultState.timelineView,
      use24Hour:
        searchParams.use24Hour === "true" || defaultState.use24Hour,
      groupId: searchParams.groupId || defaultState.groupId,
      invite: searchParams.invite || defaultState.invite,
      sortLocked:
        searchParams.sortLocked === "true" || defaultState.sortLocked,
      votePerspective:
        searchParams.votePerspective || defaultState.votePerspective,
    };
  }, [search]);

  const updateUrlState = useCallback(
    (updates: Partial<FilterSortState>) => {
      const currentState = getStateFromUrl();
      const newState = { ...currentState, ...updates };

      const newParams: FilterSortSearch = {};

      // Only add non-default values to URL
      if (newState.sort !== defaultState.sort) {
        newParams.sort = newState.sort;
      }
      if (newState.stages.length > 0) {
        newParams.stages = newState.stages.join(",");
      }
      if (newState.genres.length > 0) {
        newParams.genres = newState.genres.join(",");
      }
      if (newState.minRating > 0) {
        newParams.minRating = newState.minRating.toString();
      }
      if (newState.timelineView !== defaultState.timelineView) {
        newParams.timelineView = newState.timelineView;
      }
      if (newState.use24Hour !== defaultState.use24Hour) {
        newParams.use24Hour = newState.use24Hour.toString();
      }
      if (newState.groupId) {
        newParams.groupId = newState.groupId;
      }
      if (newState.invite) {
        newParams.invite = newState.invite;
      }
      if (newState.sortLocked) {
        newParams.sortLocked = newState.sortLocked.toString();
      }
      if (newState.votePerspective) {
        newParams.votePerspective = newState.votePerspective;
      }

      navigate({ to: ".", search: () => newParams, replace: true });
    },
    [getStateFromUrl, navigate],
  );

  const clearFilters = useCallback(() => {
    const currentState = getStateFromUrl();
    const newParams: FilterSortSearch = {};

    // Keep invite parameter when clearing filters
    if (currentState.invite) {
      newParams.invite = currentState.invite;
    }

    navigate({ to: ".", search: () => newParams, replace: true });
  }, [getStateFromUrl, navigate]);

  return {
    state: getStateFromUrl(),
    updateUrlState,
    clearFilters,
  };
}
