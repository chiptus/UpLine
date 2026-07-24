import { useState } from "react";
import { DayFilterSelect } from "../DayFilterSelect";
import { StageFilterButtons } from "../StageFilterButtons";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { FilterToggle } from "@/components/filters/FilterToggle";
import { FilterContainer } from "@/components/filters/FilterContainer";
import { cn } from "@/lib/utils";

interface LineupFiltersProps {
  tab: "timeline" | "list";
}

export function LineupFilters({ tab }: LineupFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { canShowStage } = useScheduleReveal();
  const { day, stages, updateDay, updateStages, clearFilters } =
    useTimelineUrlState(tab);

  function handleStageToggle(stageId: string) {
    const newStages = stages.includes(stageId)
      ? stages.filter((id) => id !== stageId)
      : [...stages, stageId];
    updateStages(newStages);
  }

  const activeFilterCount =
    (day !== "all" ? 1 : 0) + (canShowStage ? stages.length : 0);
  const hasActiveFilters = activeFilterCount > 0;

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

      {isExpanded && (
        <div className="mt-4">
          <div
            className={cn(
              "grid grid-cols-1 gap-3 md:gap-4",
              canShowStage && "md:grid-cols-2",
            )}
          >
            <DayFilterSelect selectedDay={day} onDayChange={updateDay} />
            {canShowStage && (
              <StageFilterButtons
                selectedStages={stages}
                onStageToggle={handleStageToggle}
              />
            )}
          </div>
        </div>
      )}
    </FilterContainer>
  );
}
