import { useCallback } from "react";
import {
  useSearch,
  useNavigate,
  useRouteContext,
} from "@tanstack/react-router";
import type { TimelineSearch } from "@/lib/searchSchemas";
import type { VoteType } from "@/lib/voteConfig";
import type { SetType } from "@/api/sets/types";
import { useStageSlugResolver } from "@/hooks/useStageSlugResolver";

export type TimeFilter = TimelineSearch["time"];

export function useTimelineUrlState(tab: "timeline" | "list" = "timeline") {
  const route =
    `/festivals/$festivalSlug/editions/$editionSlug/schedule/${tab}` as const;
  const { edition } = useRouteContext({
    from: route,
  });
  const { resolveIds, resolveSlugs } = useStageSlugResolver(edition.id);
  const state = useSearch({
    from: route,
    select: (search) => ({
      day: search.day,
      time: search.time,
      stagesIds: resolveIds(search.stages),
      votes: search.votes,
      types: search.types,
    }),
  });
  const navigate = useNavigate({ from: route });

  const updateDay = useCallback(
    (day: string) => {
      navigate({
        to: ".",
        search: (prev) => ({ ...prev, day }),
        replace: true,
        resetScroll: false,
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
        resetScroll: false,
      });
    },
    [navigate],
  );

  const updateStages = useCallback(
    (stageIds: string[]) => {
      navigate({
        to: ".",
        search: (prev) => ({
          ...prev,
          stages: resolveSlugs(stageIds),
        }),
        replace: true,
        resetScroll: false,
      });
    },
    [navigate, resolveSlugs],
  );

  const updateVotes = useCallback(
    (votes: VoteType[]) => {
      navigate({
        to: ".",
        search: (prev) => ({ ...prev, votes }),
        replace: true,
        resetScroll: false,
      });
    },
    [navigate],
  );

  const updateTypes = useCallback(
    (types: SetType[]) => {
      navigate({
        to: ".",
        search: (prev) => ({ ...prev, types }),
        replace: true,
        resetScroll: false,
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
    stagesIds: state.stagesIds,
    votes: state.votes,
    types: state.types,
    updateDay,
    updateTime,
    updateStages,
    updateVotes,
    updateTypes,
    clearFilters,
  };
}
