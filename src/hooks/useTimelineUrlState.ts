import { useCallback } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import type { TimelineSearch } from "@/lib/searchSchemas";

export type TimeFilter = TimelineSearch["time"];

export function useTimelineUrlState(tab: "timeline" | "list" = "timeline") {
  const route =
    `/festivals/$festivalSlug/editions/$editionSlug/schedule/${tab}` as const;
  // Select only the filter params this hook exposes, with structural sharing,
  // so a `scrollTo` write (from scroll syncing) doesn't change this object's
  // identity and trigger consumers to recompute the filtered schedule.
  const state = useSearch({
    from: route,
    select: (search) => ({
      day: search.day,
      time: search.time,
      stages: search.stages,
    }),
    structuralSharing: true,
  });
  const navigate = useNavigate({ from: route });

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
      search: () => ({}),
      replace: true,
    });
  }, [navigate]);

  return {
    day: state.day,
    time: state.time,
    stages: state.stages,
    updateDay,
    updateTime,
    updateStages,
    clearFilters,
  };
}
