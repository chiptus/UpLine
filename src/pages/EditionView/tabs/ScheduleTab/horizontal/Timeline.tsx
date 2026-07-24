import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useScheduleData } from "@/hooks/useScheduleData";
import {
  calculateScheduleWindow,
  calculateTimelineData,
} from "@/lib/timelineCalculator";
import { TimelineContainer } from "./TimelineContainer";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { useSetsByEditionQuery as useEditionSetsQuery } from "@/api/sets/useSetsByEdition";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import { useNow } from "@/hooks/useNow";
import { filterScheduleDays } from "@/lib/scheduleFilter";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { ScheduleNotRevealedPlaceholder } from "../ScheduleNotRevealedPlaceholder";
import { useAuth } from "@/contexts/AuthContext";
import { useUserVotes } from "@/api/voting/useUserVotes";
// PROTOTYPE: chrome-variant exploration (see ../../../prototype/)
import { useChromeVariant } from "../../../prototype/chromeVariant";

export function Timeline() {
  const variant = useChromeVariant();
  const { festival } = useFestivalEdition();
  const { edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug/schedule/timeline",
  });
  const { canShowTime } = useScheduleReveal();
  const now = useNow();
  const { data: editionSets = [], isLoading: setsLoading } =
    useEditionSetsQuery(edition.id);
  const { data: stages } = useSuspenseQuery(stagesByEditionQuery(edition.id));
  const { user } = useAuth();
  const { data: userVotes } = useUserVotes(user?.id);

  const { scheduleDays, loading, error } = useScheduleData({
    sets: editionSets,
    stages,
    timezone: festival.timezone,
  });
  const {
    day: selectedDay,
    time: selectedTime,
    stages: selectedStages,
    votes: selectedVotes,
  } = useTimelineUrlState("timeline");

  const scheduleWindow = useMemo(
    () => calculateScheduleWindow(scheduleDays),
    [scheduleDays],
  );

  const timelineData = useMemo(() => {
    if (!edition.start_date || !edition.end_date) {
      return null;
    }

    const filteredScheduleDays = filterScheduleDays(
      scheduleDays,
      {
        day: selectedDay,
        time: selectedTime,
        stages: selectedStages,
        voteTypes: selectedVotes,
        userVotes,
      },
      festival.timezone,
    );

    return calculateTimelineData(
      new Date(edition.start_date),
      new Date(edition.end_date),
      filteredScheduleDays,
      stages,
    );
  }, [
    edition,
    scheduleDays,
    selectedDay,
    selectedTime,
    selectedStages,
    selectedVotes,
    userVotes,
    stages,
    festival.timezone,
  ]);

  if (loading || setsLoading) {
    return (
      <div className="text-center text-purple-300 py-12">
        <p>Loading horizontal timeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-purple-300 py-12">
        <p>Error loading schedule.</p>
      </div>
    );
  }

  if (!timelineData) {
    return (
      <div className="text-center text-purple-300 py-12">
        <p>Festival dates not available yet.</p>
      </div>
    );
  }

  if (!canShowTime) {
    return <ScheduleNotRevealedPlaceholder />;
  }

  const container = (
    <TimelineContainer
      timelineData={timelineData}
      timezone={festival.timezone}
      scheduleDays={scheduleDays}
      selectedDay={selectedDay}
      scheduleWindow={scheduleWindow}
      now={now}
    />
  );

  // PROTOTYPE: non-current variants drop the framing box around the timeline
  if (variant !== "current") {
    return container;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white/5 rounded-lg p-4">{container}</div>
    </div>
  );
}
