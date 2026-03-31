import { useMemo } from "react";
import { useScheduleData } from "@/hooks/useScheduleData";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { useSetsByEditionQuery as useEditionSetsQuery } from "@/hooks/queries/sets/useSetsByEdition";
import { isSameDay, format } from "date-fns";
import { TimeSlotGroup } from "./TimeSlotGroup";
import type { ScheduleSet } from "@/hooks/useScheduleData";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import { useStagesByEditionQuery } from "@/hooks/queries/stages/useStagesByEdition";

interface TimeSlot {
  time: Date;
  sets: (ScheduleSet & { stageName: string; stageColor?: string })[];
}

export function ListSchedule() {
  const { edition } = useFestivalEdition();
  const { data: editionSets = [], isLoading: setsLoading } =
    useEditionSetsQuery(edition?.id);
  const stagesQuery = useStagesByEditionQuery(edition?.id);
  const { scheduleDays, loading, error } = useScheduleData(
    editionSets,
    stagesQuery.data,
  );
  const {
    day: selectedDay,
    time: selectedTime,
    stages: selectedStages,
  } = useTimelineUrlState();

  const timeSlots = useMemo(() => {
    if (!scheduleDays.length) return [];

    // Helper function to check if a set matches the day filter
    function matchesDay(set: ScheduleSet) {
      if (selectedDay === "all") return true;
      if (!set.startTime) return false;

      const setDate = format(set.startTime, "yyyy-MM-dd");
      return setDate === selectedDay;
    }

    // Helper function to check if a set matches the time filter
    function matchesTime(set: ScheduleSet) {
      if (selectedTime === "all") return true;
      if (!set.startTime) return false;

      const hour = set.startTime.getHours();
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

    // Helper function to check if a set matches the stage filter
    function matchesStage(stageName: string) {
      if (selectedStages.length === 0) return true;
      return selectedStages.includes(stageName);
    }

    // Collect all unique start times with filtering
    const allSets: (ScheduleSet & {
      stageName: string;
      stageColor?: string;
    })[] = [];

    scheduleDays.forEach((day) => {
      day.stages.forEach((stage) => {
        if (!matchesStage(stage.id)) {
          console.log("Skipping stage:", stage.name, selectedStages);
          return;
        }

        // Find the stage data to get color information
        const stageData = stagesQuery.data?.find((s) => s.id === stage.id);

        stage.sets.forEach((set) => {
          if (set.startTime && matchesDay(set) && matchesTime(set)) {
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
    stagesQuery.data,
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

  if (!edition?.published) {
    return (
      <div className="text-center text-purple-300 py-12">
        <p>Schedule not yet published.</p>
      </div>
    );
  }

  if (!timeSlots.length) {
    return (
      <div className="text-center text-purple-300 py-12">
        <p>No scheduled sets found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {timeSlots.map((slot, index) => {
        const prevSlot = index > 0 ? timeSlots[index - 1] : null;
        const showDateHeader =
          !prevSlot || !isSameDay(slot.time, prevSlot.time);

        return (
          <TimeSlotGroup
            key={slot.time.toISOString()}
            timeSlot={slot}
            showDateHeader={showDateHeader}
          />
        );
      })}
    </div>
  );
}
