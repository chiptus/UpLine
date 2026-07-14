import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { useScheduleData } from "@/hooks/useScheduleData";
import {
  calculateScheduleWindow,
  calculateTimelineData,
} from "@/lib/timelineCalculator";
import { StageLabels } from "./StageLabels";
import { TimelineContainer } from "./TimelineContainer";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { useSetsByEditionQuery as useEditionSetsQuery } from "@/api/sets/useSetsByEdition";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import { useNow } from "@/hooks/useNow";
import { getFestivalHour } from "@/lib/timeUtils";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { ScheduleNotRevealedPlaceholder } from "../ScheduleNotRevealedPlaceholder";

export function Timeline() {
  const { festival } = useFestivalEdition();
  const { edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug/schedule/timeline",
  });
  const { canShowTime } = useScheduleReveal();
  const now = useNow();
  const { data: editionSets = [], isLoading: setsLoading } =
    useEditionSetsQuery(edition.id);
  const { data: stages } = useSuspenseQuery(stagesByEditionQuery(edition.id));

  const { scheduleDays, loading, error } = useScheduleData({
    sets: editionSets,
    stages,
    timezone: festival.timezone,
  });
  const {
    day: selectedDay,
    time: selectedTime,
    stages: selectedStages,
  } = useTimelineUrlState("timeline");

  // From the UNFILTERED schedule: the window that gates time-awareness (Now
  // pill, mount-time now-rule), immune to the filters applied below.
  const scheduleWindow = useMemo(
    () => calculateScheduleWindow(scheduleDays),
    [scheduleDays],
  );

  const timelineData = useMemo(() => {
    if (!edition.start_date || !edition.end_date) {
      return null;
    }

    // Apply filters to scheduleDays
    const filteredScheduleDays = scheduleDays.map((day) => {
      // Filter by day
      if (selectedDay !== "all" && day.date !== selectedDay) {
        return { ...day, stages: [] }; // Empty day if not selected
      }

      // Filter stages and sets
      const filteredStages = day.stages
        .filter((stage) => {
          // Filter by stage
          if (selectedStages.length > 0 && !selectedStages.includes(stage.id)) {
            return false;
          }
          return true;
        })
        .map((stage) => ({
          ...stage,
          sets: stage.sets.filter((set) => {
            // Filter by time
            if (selectedTime !== "all" && set.startTime) {
              const hour = getFestivalHour(
                set.startTime.toISOString(),
                festival.timezone,
              );
              if (hour === null) return false;
              switch (selectedTime) {
                case "morning":
                  return hour >= 6 && hour < 12;
                case "afternoon":
                  return hour >= 12 && hour < 18;
                case "evening":
                  return hour >= 18 && hour < 24;
                default:
                  return true;
              }
            }
            return true;
          }),
        }));

      return { ...day, stages: filteredStages };
    });

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

  return (
    <div className="space-y-8">
      <div className="relative bg-white/5 rounded-lg p-4">
        <StageLabels stages={timelineData.stages} />
        <TimelineContainer
          timelineData={timelineData}
          timezone={festival.timezone}
          scheduleDays={scheduleDays}
          selectedDay={selectedDay}
          scheduleWindow={scheduleWindow}
          now={now}
        />
      </div>
    </div>
  );
}
