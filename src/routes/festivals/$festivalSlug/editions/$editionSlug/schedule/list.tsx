import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useScheduleData } from "@/hooks/useScheduleData";
import { useSetsByEditionQuery as useEditionSetsQuery } from "@/api/sets/useSetsByEdition";
import { filterScheduleDays } from "@/lib/scheduleFilter";
import { ListDayGroup } from "@/pages/EditionView/tabs/ScheduleTab/list/ListDayGroup";
import { ScheduleFilterSheet } from "@/pages/EditionView/tabs/ScheduleTab/ScheduleFilterSheet";
import type { ScheduleSet } from "@/hooks/useScheduleData";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { ScheduleLineupView } from "@/pages/EditionView/tabs/ScheduleTab/lineup/ScheduleLineupView";
import { useAuth } from "@/contexts/AuthContext";
import { useScheduleVoteScope } from "@/hooks/useScheduleVoteScope";
import {
  timelineSearchDefaults,
  timelineSearchSchema,
} from "@/lib/searchSchemas";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/schedule/list",
)({
  component: ListSchedule,
  validateSearch: timelineSearchSchema,
  search: {
    middlewares: [stripSearchParams(timelineSearchDefaults)],
  },
});

interface TimeSlot {
  time: Date;
  sets: (ScheduleSet & {
    stageName: string;
    stageColor?: string | undefined;
  })[];
}

interface DayGroup {
  dayKey: string;
  slots: TimeSlot[];
}

function ListSchedule() {
  const { festival, edition } = Route.useRouteContext();
  const { canShowTime } = useScheduleReveal();
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
  } = useTimelineUrlState("list");

  const dayGroups = useMemo(() => {
    if (!scheduleDays.length) return [];

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

    // The day filter narrows to the days the user picked; set-level filters
    // (type/vote/time/stage) never drop a day, they just empty its stages
    // (see filterScheduleDays' contract) so its header stays visible with an
    // empty state instead of disappearing.
    const visibleDays =
      selectedDay === "all"
        ? filteredScheduleDays
        : filteredScheduleDays.filter((day) => day.date === selectedDay);

    return visibleDays.map((day): DayGroup => {
      // Enrich each set with the stage name/color the group view needs.
      // Sets without a startTime can't be placed into a time slot, so
      // they're dropped here.
      const daySets: (ScheduleSet & {
        stageName: string;
        stageColor?: string | undefined;
      })[] = [];

      day.stages.forEach((stage) => {
        const stageData = stages.find((s) => s.id === stage.id);

        stage.sets.forEach((set) => {
          if (set.startTime) {
            daySets.push({
              ...set,
              stageName: stage.name,
              stageColor: stageData?.color || undefined,
            });
          }
        });
      });

      // Group sets by start time
      const timeGroups = new Map<string, typeof daySets>();

      daySets.forEach((set) => {
        if (!set.startTime) return;

        const timeKey = set.startTime.toISOString();
        if (!timeGroups.has(timeKey)) {
          timeGroups.set(timeKey, []);
        }
        timeGroups.get(timeKey)!.push(set);
      });

      // Convert to sorted array
      const slots: TimeSlot[] = Array.from(timeGroups.entries())
        .map(([timeKey, sets]) => ({
          time: new Date(timeKey),
          sets: sets,
        }))
        .sort((a, b) => a.time.getTime() - b.time.getTime());

      return { dayKey: day.date, slots };
    });
  }, [
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
        <p>Loading schedule...</p>
      </div>
    );
  }

  if (!canShowTime) {
    return <ScheduleLineupView tab="list" />;
  }

  if (!dayGroups.length) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>No scheduled sets found.</p>
        <div className="mt-4 flex justify-center">
          <ScheduleFilterSheet tab="list" />
        </div>
      </div>
    );
  }

  return (
    <section aria-label="Schedule by day" className="space-y-8">
      {dayGroups.map((day) => (
        <ListDayGroup
          key={day.dayKey}
          dayKey={day.dayKey}
          slots={day.slots}
          timezone={festival.timezone}
        />
      ))}
    </section>
  );
}
