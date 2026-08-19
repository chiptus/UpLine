import { useCallback } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import type { TimelineSearch } from "@/lib/searchSchemas";
import type { VoteType } from "@/lib/voteConfig";

export type TimeFilter = TimelineSearch["time"];

export function useTimelineUrlState(tab: "timeline" | "list" = "timeline") {
  const route =
    `/festivals/$festivalSlug/editions/$editionSlug/schedule/${tab}` as const;
  const state = useSearch({
    from: route,
    select: (search) => ({
      day: search.day,
      time: search.time,
      stages: search.stages,
      votes: search.votes,
    }),
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

  const updateVotes = useCallback(
    (votes: VoteType[]) => {
      navigate({
        to: ".",
        search: (prev) => ({ ...prev, votes }),
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
    votes: state.votes,
    updateDay,
    updateTime,
    updateStages,
    updateVotes,
    clearFilters,
  };
}
