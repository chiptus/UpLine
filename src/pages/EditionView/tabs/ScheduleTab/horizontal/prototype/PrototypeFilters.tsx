// PROTOTYPE (timeline nav & filtering) — throwaway, delete with this folder.
//
// The shared collapsed filter panel ("filtering narrows, it never scrolls"):
// day / time-of-day / stage, plus an optional my-vote chips slot (variant A
// places the chips here; B and C surface them elsewhere). Vote selections
// count toward the filter badge either way.
import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Vote } from "lucide-react";
import { DayFilterSelect } from "../../DayFilterSelect";
import { TimeFilterSelect } from "../../TimeFilterSelect";
import { StageFilterButtons } from "../../StageFilterButtons";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import { FilterToggle } from "@/components/filters/FilterToggle";
import { FilterContainer } from "@/components/filters/FilterContainer";
import { cn } from "@/lib/utils";

interface PrototypeFiltersProps {
  voteChips?: ReactNode;
  voteFilterCount: number;
  onClearVotes: () => void;
}

export function PrototypeFilters({
  voteChips,
  voteFilterCount,
  onClearVotes,
}: PrototypeFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { day, time, stages, updateDay, updateTime, updateStages } =
    useTimelineUrlState("timeline");
  const navigate = useNavigate({
    from: "/festivals/$festivalSlug/editions/$editionSlug/schedule/timeline",
  });

  const activeFilterCount =
    (day !== "all" ? 1 : 0) +
    (time !== "all" ? 1 : 0) +
    stages.length +
    voteFilterCount;
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
          onClearFilters={hasActiveFilters ? clearAll : undefined}
        />
      </div>

      {isExpanded && (
        <div className="mt-4">
          <div
            className={cn(
              "grid grid-cols-1 gap-3 md:gap-4",
              voteChips ? "md:grid-cols-4" : "md:grid-cols-3",
            )}
          >
            <DayFilterSelect selectedDay={day} onDayChange={updateDay} />
            <TimeFilterSelect selectedTime={time} onTimeChange={updateTime} />
            <StageFilterButtons
              selectedStages={stages}
              onStageToggle={handleStageToggle}
            />
            {voteChips && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Vote className="h-3 w-3 text-purple-300" />
                  <label className="text-sm font-medium text-purple-200">
                    My votes
                  </label>
                </div>
                {voteChips}
              </div>
            )}
          </div>
        </div>
      )}
    </FilterContainer>
  );

  function handleStageToggle(stageId: string) {
    const newStages = stages.includes(stageId)
      ? stages.filter((id) => id !== stageId)
      : [...stages, stageId];
    updateStages(newStages);
  }

  function clearAll() {
    onClearVotes();
    navigate({
      to: ".",
      search: (prev) => ({
        view: prev.view,
        variant: prev.variant,
        scrollTo: prev.scrollTo,
      }),
      replace: true,
    });
  }
}
