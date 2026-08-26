import { useCallback, useMemo } from "react";
import {
  useSearch,
  useNavigate,
  useRouteContext,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { TimelineSearch } from "@/lib/searchSchemas";
import type { VoteType } from "@/lib/voteConfig";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import {
  resolveStageIdsFromSlugs,
  resolveStageSlugsFromIds,
} from "@/lib/stageSlugs";

export type TimeFilter = TimelineSearch["time"];

export function useTimelineUrlState(tab: "timeline" | "list" = "timeline") {
  const route =
    `/festivals/$festivalSlug/editions/$editionSlug/schedule/${tab}` as const;
  const { edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });
  const { data: stages = [] } = useQuery(stagesByEditionQuery(edition.id));
  const search = useSearch({
    from: route,
    select: (search) => ({
      day: search.day,
      time: search.time,
      stages: search.stages,
      votes: search.votes,
    }),
  });
  const state = useMemo(
    () => ({
      ...search,
      stages: resolveStageIdsFromSlugs(search.stages, stages),
    }),
    [search, stages],
  );
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
    (stageIds: string[]) => {
      navigate({
        to: ".",
        search: (prev) => ({
          ...prev,
          stages: resolveStageSlugsFromIds(stageIds, stages),
        }),
        replace: true,
      });
    },
    [navigate, stages],
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
