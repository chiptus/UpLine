import { useCallback } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import type { TimelineSearch } from "@/lib/searchSchemas";

export type TimelineView = TimelineSearch["view"];
export type TimeFilter = TimelineSearch["time"];

export function useTimelineUrlState() {
  const state = useSearch({ strict: false }) as TimelineSearch;
  const navigate = useNavigate();

  const updateView = useCallback(
    (view: TimelineView) => {
      navigate({
        to: ".",
        search: (prev) => ({ ...prev, view }),
        replace: true,
      });
    },
    [navigate],
  );

  const updateDay = useCallback(
    (day: string) => {
      navigate({
        to: ".",
        search: (prev) => ({ ...prev, day }),
        replace: true,
      });
    },
    [navigate],
  );

  const updateTime = useCallback(
    (time: TimeFilter) => {
      navigate({
        to: ".",
        search: (prev) => ({ ...prev, time }),
        replace: true,
      });
    },
    [navigate],
  );

  const updateStages = useCallback(
    (stages: string[]) => {
      navigate({
        to: ".",
        search: (prev) => ({ ...prev, stages }),
        replace: true,
      });
    },
    [navigate],
  );

  const clearFilters = useCallback(() => {
    navigate({
      to: ".",
      search: (prev) => ({ view: (prev as TimelineSearch).view }),
      replace: true,
    });
  }, [navigate]);

  return {
    view: state.view,
    day: state.day,
    time: state.time,
    stages: state.stages,
    updateView,
    updateDay,
    updateTime,
    updateStages,
    clearFilters,
  };
}
