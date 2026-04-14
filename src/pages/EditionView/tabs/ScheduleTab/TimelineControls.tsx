import { useState } from "react";
import { TimelineNavigation } from "./TimelineNavigation";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import { FilterToggle } from "@/components/filters/FilterToggle";
import { FilterContainer } from "@/components/filters/FilterContainer";

export function TimelineControls() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { stages, updateStages, clearFilters } =
    useTimelineUrlState("timeline");

  function handleStageToggle(stageId: string) {
    const newStages = stages.includes(stageId)
      ? stages.filter((id) => id !== stageId)
      : [...stages, stageId];
    updateStages(newStages);
  }

  const activeFilterCount = stages.length;
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
            selectedStages={stages}
            onStageToggle={handleStageToggle}
            onJumpToToday={() => {
              console.log("Jump to today");
            }}
            onJumpToTime={(timeOfDay) => {
              console.log("Jump to", timeOfDay);
            }}
          />
        </div>
      )}
    </FilterContainer>
  );
}
