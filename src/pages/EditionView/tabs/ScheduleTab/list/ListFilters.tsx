import { useState } from "react";
import { DayFilterSelect } from "../DayFilterSelect";
import { TimeFilterSelect } from "../TimeFilterSelect";
import { StageFilterButtons } from "../StageFilterButtons";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import { FilterToggle } from "@/components/filters/FilterToggle";
import { FilterContainer } from "@/components/filters/FilterContainer";

export function ListFilters() {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    day,
    time,
    stages,
    updateDay,
    updateTime,
    updateStages,
    clearFilters,
  } = useTimelineUrlState("list");

  function handleStageToggle(stageId: string) {
    const newStages = stages.includes(stageId)
      ? stages.filter((id) => id !== stageId)
      : [...stages, stageId];
    updateStages(newStages);
  }

  const activeFilterCount =
    (day !== "all" ? 1 : 0) + (time !== "all" ? 1 : 0) + stages.length;
  const hasActiveFilters = activeFilterCount > 0;
  const shouldShowFilters = isExpanded;

  return (
    <FilterContainer>
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-purple-100 font-medium">Filters</h3>
        <div className="ml-auto" />

        <FilterToggle
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          label="Filters"
          onClearFilters={hasActiveFilters ? clearFilters : undefined}
        />
      </div>

      {shouldShowFilters && (
        <div className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <DayFilterSelect selectedDay={day} onDayChange={updateDay} />
            <TimeFilterSelect selectedTime={time} onTimeChange={updateTime} />
            <StageFilterButtons
              selectedStages={stages}
              onStageToggle={handleStageToggle}
            />
          </div>
        </div>
      )}
    </FilterContainer>
  );
}
