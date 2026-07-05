import { useMemo } from "react";
import { useScheduleData } from "@/hooks/useScheduleData";
import { calculateTimelineData } from "@/lib/timelineCalculator";
import { StageLabels } from "./StageLabels";
import { TimelineContainer } from "./TimelineContainer";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { useSetsByEditionQuery as useEditionSetsQuery } from "@/api/sets/useSetsByEdition";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import { getFestivalHour } from "@/lib/timeUtils";
import { useStagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { ScheduleNotRevealedPlaceholder } from "../ScheduleNotRevealedPlaceholder";

export function Timeline() {
  const { edition, festival } = useFestivalEdition();
  const { canShowTime } = useScheduleReveal();
  const { data: editionSets = [], isLoading: setsLoading } =
    useEditionSetsQuery(edition?.id);
  const stagesQuery = useStagesByEditionQuery(edition?.id);

  const { scheduleDays, loading, error } = useScheduleData({
    sets: editionSets,
    stages: stagesQuery.data,
    timezone: festival.timezone,
  });
  const {
    day: selectedDay,
    time: selectedTime,
    stages: selectedStages,
  } = useTimelineUrlState("timeline");

  const timelineData = useMemo(() => {
    if (!edition || !edition.start_date || !edition.end_date) {
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
      stagesQuery.data || [],
    );
  }, [
    edition,
    scheduleDays,
    selectedDay,
    selectedTime,
    selectedStages,
    stagesQuery.data,
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
        />
      </div>
    </div>
  );
}
