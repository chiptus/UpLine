import { useState } from "react";
import { TimelineNavigation } from "./TimelineNavigation";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import { FilterToggle } from "@/components/filters/FilterToggle";
import { FilterContainer } from "@/components/filters/FilterContainer";
import { format } from "date-fns";

export function TimelineControls() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { state, updateState, clearFilters } = useTimelineUrlState();
  const { selectedStages } = state;

  function handleStageToggle(stageId: string) {
    const newStages = selectedStages.includes(stageId)
      ? selectedStages.filter((id) => id !== stageId)
      : [...selectedStages, stageId];
    updateState({ selectedStages: newStages });
  }

  function handleJumpToNow() {
    const now = new Date();
    const jumpToTime = format(now, "yyyy-MM-dd'T'HH:mm");
    updateState({ jumpToTime });
  }

  function handleJumpToTime(timeOfDay: "morning" | "afternoon" | "evening") {
    const now = new Date();
    let targetHour = 12;

    switch (timeOfDay) {
      case "morning":
        targetHour = 9;
        break;
      case "afternoon":
        targetHour = 15;
        break;
      case "evening":
        targetHour = 21;
        break;
    }

    const targetTime = new Date(now);
    targetTime.setHours(targetHour, 0, 0, 0);
    const jumpToTime = format(targetTime, "yyyy-MM-dd'T'HH:mm");
    updateState({ jumpToTime });
  }

  const activeFilterCount = selectedStages.length;
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <FilterContainer>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="ml-auto" />

        <FilterToggle
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          label="Navigation"
          onClearFilters={hasActiveFilters ? clearFilters : undefined}
        />
      </div>

      {isExpanded && (
        <div className="mt-4">
          <TimelineNavigation
            selectedStages={selectedStages}
            onStageToggle={handleStageToggle}
            onJumpToToday={handleJumpToNow}
            onJumpToTime={handleJumpToTime}
          />
        </div>
      )}
    </FilterContainer>
  );
}
