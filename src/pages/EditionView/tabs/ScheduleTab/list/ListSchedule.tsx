import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useScheduleData } from "@/hooks/useScheduleData";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { useSetsByEditionQuery as useEditionSetsQuery } from "@/api/sets/useSetsByEdition";
import { getFestivalDayKey } from "@/lib/timeUtils";
import { filterScheduleDays } from "@/lib/scheduleFilter";
import { TimeSlotGroup } from "./TimeSlotGroup";
import type { ScheduleSet } from "@/hooks/useScheduleData";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { ScheduleNotRevealedPlaceholder } from "../ScheduleNotRevealedPlaceholder";
import { useAuth } from "@/contexts/AuthContext";
import { useUserVotes } from "@/api/voting/useUserVotes";
// PROTOTYPE: chrome-variant exploration (see ../../../prototype/)
import { useChromeVariant } from "../../../prototype/chromeVariant";
import { ListDayHeader } from "../../../prototype/ListDayHeader";

interface TimeSlot {
  time: Date;
  sets: (ScheduleSet & { stageName: string; stageColor?: string })[];
}

export function ListSchedule() {
  const variant = useChromeVariant();
  const { festival } = useFestivalEdition();
  const { edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug/schedule/list",
  });
  const { canShowTime } = useScheduleReveal();
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
  } = useTimelineUrlState("list");

  const timeSlots = useMemo(() => {
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

    return slots;
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

  if (loading || setsLoading) {
    return (
      <div className="text-center text-purple-300 py-12">
        <p>Loading schedule...</p>
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

  if (!canShowTime) {
    return <ScheduleNotRevealedPlaceholder />;
  }

  if (!timeSlots.length) {
    return (
      <div className="text-center text-purple-300 py-12">
        <p>No scheduled sets found.</p>
      </div>
    );
  }

  // PROTOTYPE: non-current variants group slots per day so the sticky day
  // header's range spans the whole day (it previously lived inside the
  // day's first slot and un-stuck after it)
  if (variant !== "current") {
    const dayGroups: { dayKey: string | null; slots: TimeSlot[] }[] = [];
    for (const slot of timeSlots) {
      const dayKey = getFestivalDayKey(
        slot.time.toISOString(),
        festival.timezone,
      );
      const lastGroup = dayGroups[dayGroups.length - 1];
      if (lastGroup && lastGroup.dayKey === dayKey) {
        lastGroup.slots.push(slot);
      } else {
        dayGroups.push({ dayKey, slots: [slot] });
      }
    }

    return (
      <div className="space-y-6" data-testid="list-schedule">
        {dayGroups.map(({ slots }) => (
          <div key={slots[0].time.toISOString()}>
            <ListDayHeader
              isoTime={slots[0].time.toISOString()}
              timezone={festival.timezone}
              withFilters={variant === "autohide"}
            />
            <div className="space-y-6">
              {slots.map((slot) => (
                <TimeSlotGroup
                  key={slot.time.toISOString()}
                  timeSlot={slot}
                  timezone={festival.timezone}
                  showDateHeader={false}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="list-schedule">
      {timeSlots.map((slot, index) => {
        const prevSlot = index > 0 ? timeSlots[index - 1] : null;
        const showDateHeader =
          !prevSlot ||
          getFestivalDayKey(slot.time.toISOString(), festival.timezone) !==
            getFestivalDayKey(prevSlot.time.toISOString(), festival.timezone);

        return (
          <TimeSlotGroup
            key={slot.time.toISOString()}
            timeSlot={slot}
            timezone={festival.timezone}
            showDateHeader={showDateHeader}
          />
        );
      })}
    </div>
  );
}
