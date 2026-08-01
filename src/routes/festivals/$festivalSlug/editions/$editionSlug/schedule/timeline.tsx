import { useMemo } from "react";
import {
  createFileRoute,
  stripSearchParams,
  useRouteContext,
} from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  timelineSearchDefaults,
  timelineSearchSchema,
} from "@/lib/searchSchemas";
import { useScheduleData } from "@/hooks/useScheduleData";
import {
  calculateScheduleWindow,
  calculateTimelineData,
} from "@/lib/timelineCalculator";
import { TimelineContainer } from "@/pages/EditionView/tabs/ScheduleTab/horizontal/TimelineContainer";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { useSetsByEditionQuery as useEditionSetsQuery } from "@/api/sets/useSetsByEdition";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import { useNow } from "@/hooks/useNow";
import { filterScheduleDays } from "@/lib/scheduleFilter";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { ScheduleLineupView } from "@/pages/EditionView/tabs/ScheduleTab/lineup/ScheduleLineupView";
import { useAuth } from "@/contexts/AuthContext";
import { useUserVotesQuery } from "@/api/voting/useUserVotesQuery";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/schedule/timeline",
)({
  component: ScheduleTabTimeline,
  validateSearch: timelineSearchSchema,
  search: {
    middlewares: [stripSearchParams(timelineSearchDefaults)],
  },
});

function ScheduleTabTimeline() {
  const { canShowTime } = useScheduleReveal();

  return canShowTime ? (
    <TimelineContent />
  ) : (
    <ScheduleLineupView tab="timeline" />
  );
}

function TimelineContent() {
  const { festival } = useFestivalEdition();
  const { edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug/schedule/timeline",
  });
  const now = useNow();
  const { data: editionSets = [], isLoading: setsLoading } =
    useEditionSetsQuery(edition.id);
  const { data: stages } = useSuspenseQuery(stagesByEditionQuery(edition.id));
  const { user } = useAuth();
  const { data: userVotes } = useUserVotesQuery(user?.id);

  const { scheduleDays } = useScheduleData({
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

  if (setsLoading) {
    return (
      <div className="text-center text-purple-300 py-12">
        <p>Loading horizontal timeline...</p>
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

  return (
    <TimelineContainer
      timelineData={timelineData}
      timezone={festival.timezone}
      scheduleDays={scheduleDays}
      selectedDay={selectedDay}
      scheduleWindow={scheduleWindow}
      now={now}
    />
  );
}
