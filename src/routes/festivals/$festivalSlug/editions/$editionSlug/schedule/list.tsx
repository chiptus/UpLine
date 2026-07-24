import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useScheduleData } from "@/hooks/useScheduleData";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { useSetsByEditionQuery as useEditionSetsQuery } from "@/api/sets/useSetsByEdition";
import { getFestivalDayKey } from "@/lib/timeUtils";
import { filterScheduleDays } from "@/lib/scheduleFilter";
import { ListDayGroup } from "@/pages/EditionView/tabs/ScheduleTab/list/ListDayGroup";
import { ScheduleFilterSheet } from "@/pages/EditionView/tabs/ScheduleTab/ScheduleFilterSheet";
import type { ScheduleSet } from "@/hooks/useScheduleData";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { ScheduleLineupView } from "@/pages/EditionView/tabs/ScheduleTab/lineup/ScheduleLineupView";
import { useAuth } from "@/contexts/AuthContext";
import { useUserVotesQuery } from "@/api/voting/useUserVotesQuery";
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
  sets: (ScheduleSet & { stageName: string; stageColor?: string })[];
}

interface DayGroup {
  dayKey: string;
  slots: TimeSlot[];
}

function ListSchedule() {
  const { festival } = useFestivalEdition();
  const { edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug/schedule/list",
  });
  const { canShowTime } = useScheduleReveal();
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
        userVotes,
      },
      festival.timezone,
    );

    // Flatten filtered days/stages into a single list, enriching each set
    // with the stage name/color the group view needs. Sets without a
    // startTime can't be placed into a time slot, so they're dropped here.
    const allSets: (ScheduleSet & {
      stageName: string;
      stageColor?: string;
    })[] = [];

    filteredScheduleDays.forEach((day) => {
      day.stages.forEach((stage) => {
        const stageData = stages.find((s) => s.id === stage.id);

        stage.sets.forEach((set) => {
          if (set.startTime) {
            allSets.push({
              ...set,
              stageName: stage.name,
              stageColor: stageData?.color || undefined,
            });
          }
        });
      });
    });

    // Group sets by start time
    const timeGroups = new Map<
      string,
      (ScheduleSet & { stageName: string; stageColor?: string })[]
    >();

    allSets.forEach((set) => {
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

    const groups = new Map<string, TimeSlot[]>();
    slots.forEach((slot) => {
      const dayKey = getFestivalDayKey(
        slot.time.toISOString(),
        festival.timezone,
      );
      if (!dayKey) return;
      if (!groups.has(dayKey)) groups.set(dayKey, []);
      groups.get(dayKey)!.push(slot);
    });

    const sortedDayGroups: DayGroup[] = Array.from(groups.entries())
      .map(([dayKey, daySlots]) => ({ dayKey, slots: daySlots }))
      .sort((a, b) => a.dayKey.localeCompare(b.dayKey));

    return sortedDayGroups;
  }, [
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
        <p>Loading schedule...</p>
      </div>
    );
  }

  if (!canShowTime) {
    return <ScheduleLineupView tab="list" />;
  }

  if (!dayGroups.length) {
    return (
      <div className="text-center text-purple-300 py-12">
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
