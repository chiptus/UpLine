import { useCallback, useMemo } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import type { TimelineSearch } from "@/lib/searchSchemas";

export type TimelineView = "horizontal" | "list";
export type TimeFilter = "all" | "morning" | "afternoon" | "evening";

export interface TimelineState {
  timelineView: TimelineView;
  selectedDay: string; // Dynamic based on festival dates
  selectedTime: TimeFilter;
  selectedStages: string[];
}

const defaultState: TimelineState = {
  timelineView: "list",
  selectedDay: "all",
  selectedTime: "all",
  selectedStages: [],
};

export function useTimelineUrlState() {
  const search = useSearch({ strict: false });
  const navigate = useNavigate();

  const getStateFromUrl = useCallback((): TimelineState => {
    const params = search as Record<string, string | undefined>;
    return {
      timelineView:
        (params.view as TimelineView) || defaultState.timelineView,
      selectedDay: params.day || defaultState.selectedDay,
      selectedTime:
        (params.time as TimeFilter) || defaultState.selectedTime,
      selectedStages:
        params.stages?.split(",").filter(Boolean) ||
        defaultState.selectedStages,
    };
  }, [search]);

  const updateTimelineState = useCallback(
    (updates: Partial<TimelineState>) => {
      const currentState = getStateFromUrl();
      const newState = { ...currentState, ...updates };

      const newSearchParams: TimelineSearch = {};

      // Only add non-default values to URL
      if (newState.timelineView !== defaultState.timelineView) {
        newSearchParams.view = newState.timelineView;
      }
      if (newState.selectedDay !== defaultState.selectedDay) {
        newSearchParams.day = newState.selectedDay;
      }
      if (newState.selectedTime !== defaultState.selectedTime) {
        newSearchParams.time = newState.selectedTime;
      }
      if (newState.selectedStages.length > 0) {
        newSearchParams.stages = newState.selectedStages.join(",");
      }

      navigate({ to: ".", search: () => newSearchParams, replace: true });
    },
    [getStateFromUrl, navigate],
  );

  const clearTimelineFilters = useCallback(() => {
    const currentState = getStateFromUrl();
    const newSearchParams: TimelineSearch = {};

    // Keep view when clearing filters
    if (currentState.timelineView !== defaultState.timelineView) {
      newSearchParams.view = currentState.timelineView;
    }

    navigate({ to: ".", search: () => newSearchParams, replace: true });
  }, [getStateFromUrl, navigate]);

  const state = useMemo(() => getStateFromUrl(), [getStateFromUrl]);

  return {
    state,
    updateState: updateTimelineState,
    clearFilters: clearTimelineFilters,
  };
}
