import { useMemo } from "react";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
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
import { useSetsByEditionQuery as useEditionSetsQuery } from "@/api/sets/useSetsByEdition";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import { useNow } from "@/hooks/useNow";
import { filterScheduleDays } from "@/lib/scheduleFilter";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { ScheduleLineupView } from "@/pages/EditionView/tabs/ScheduleTab/lineup/ScheduleLineupView";
import { useAuth } from "@/contexts/AuthContext";
import { useScheduleVoteScope } from "@/hooks/useScheduleVoteScope";

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
  const { festival, edition } = Route.useRouteContext();
  const now = useNow();
  const { data: editionSets = [], isLoading: setsLoading } =
    useEditionSetsQuery(edition.id);
  const { data: stages } = useSuspenseQuery(stagesByEditionQuery(edition.id));
  const { user } = useAuth();
  const { voteScope, groupMemberIds } = useScheduleVoteScope();

  const { scheduleDays } = useScheduleData({
    sets: editionSets,
    stages,
    timezone: festival.timezone,
  });
  const {
    day: selectedDay,
    time: selectedTime,
    stagesIds: selectedStages,
    votes: selectedVotes,
    types: selectedTypes,
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
        setTypes: selectedTypes,
        voteScope,
        currentUserId: user?.id,
        groupMemberIds,
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
    selectedTypes,
    voteScope,
    user?.id,
    groupMemberIds,
    stages,
    festival.timezone,
  ]);

  if (setsLoading) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Loading horizontal timeline...</p>
      </div>
    );
  }

  if (!timelineData) {
    return (
      <div className="text-center text-muted-foreground py-12">
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
