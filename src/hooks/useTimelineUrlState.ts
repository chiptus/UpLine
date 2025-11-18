import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export type TimelineView = "horizontal" | "list";
export type TimeFilter = "all" | "morning" | "afternoon" | "evening";

export interface TimelineState {
  timelineView: TimelineView;
  selectedDay: string; // Dynamic based on festival dates
  selectedTime: TimeFilter;
  selectedStages: string[];
  jumpToTime?: string; // ISO format: YYYY-MM-DDTHH:mm
}

const defaultState: TimelineState = {
  timelineView: "list",
  selectedDay: "all",
  selectedTime: "all",
  selectedStages: [],
  jumpToTime: undefined,
};

export function useTimelineUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const getStateFromUrl = useCallback((): TimelineState => {
    return {
      timelineView:
        (searchParams.get("view") as TimelineView) || defaultState.timelineView,
      selectedDay: searchParams.get("day") || defaultState.selectedDay,
      selectedTime:
        (searchParams.get("time") as TimeFilter) || defaultState.selectedTime,
      selectedStages:
        searchParams.get("stages")?.split(",").filter(Boolean) ||
        defaultState.selectedStages,
      jumpToTime: searchParams.get("jumpTo") || undefined,
    };
  }, [searchParams]);

  const updateTimelineState = useCallback(
    (updates: Partial<TimelineState>) => {
      const currentState = getStateFromUrl();
      const newState = { ...currentState, ...updates };

      const newParams = new URLSearchParams();

      // Only add non-default values to URL
      if (newState.timelineView !== defaultState.timelineView) {
        newParams.set("view", newState.timelineView);
      }
      if (newState.selectedDay !== defaultState.selectedDay) {
        newParams.set("day", newState.selectedDay);
      }
      if (newState.selectedTime !== defaultState.selectedTime) {
        newParams.set("time", newState.selectedTime);
      }
      if (newState.selectedStages.length > 0) {
        newParams.set("stages", newState.selectedStages.join(","));
      }
      if (newState.jumpToTime) {
        newParams.set("jumpTo", newState.jumpToTime);
      }

      setSearchParams(newParams, { replace: true });
    },
    [getStateFromUrl, setSearchParams],
  );

  const clearTimelineFilters = useCallback(() => {
    const currentState = getStateFromUrl();
    const newParams = new URLSearchParams();

    // Keep view when clearing filters
    if (currentState.timelineView !== defaultState.timelineView) {
      newParams.set("view", currentState.timelineView);
    }

    setSearchParams(newParams, { replace: true });
  }, [getStateFromUrl, setSearchParams]);

  return {
    state: getStateFromUrl(),
    updateState: updateTimelineState,
    clearFilters: clearTimelineFilters,
  };
}
