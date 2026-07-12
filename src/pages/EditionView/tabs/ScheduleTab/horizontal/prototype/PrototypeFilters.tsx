// PROTOTYPE (timeline nav & filtering) — throwaway, delete with this folder.
//
// The shared filter drawer ("filtering narrows, it never scrolls"): day /
// time-of-day / stage in a bottom sheet, not an always-inline panel — so the
// schedule stays the visual focus instead of competing with an expanded
// filter block. Optional my-vote chips slot (variant a places chips here; b
// keeps its own always-visible inline row). Vote selections still count
// toward the badge either way.
import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Filter, Vote, X } from "lucide-react";
import { DayFilterSelect } from "../../DayFilterSelect";
import { TimeFilterSelect } from "../../TimeFilterSelect";
import { StageFilterButtons } from "../../StageFilterButtons";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  const [isOpen, setIsOpen] = useState(false);
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
    <div className="flex items-center gap-2">
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
        >
          <X className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      )}

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex items-center gap-2",
              hasActiveFilters
                ? "bg-purple-600/50 text-purple-100 hover:bg-purple-600/60"
                : "text-purple-300 hover:text-purple-100",
            )}
          >
            {hasActiveFilters && (
              <Badge
                variant="secondary"
                className="bg-purple-800/50 text-purple-100"
              >
                {activeFilterCount}
              </Badge>
            )}
            <Filter className="h-4 w-4" />
            <span className="hidden md:inline">Filters</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="bg-gray-900 border-purple-400/30 text-purple-100"
        >
          <SheetHeader>
            <SheetTitle className="text-purple-100">Filters</SheetTitle>
            <SheetDescription className="text-purple-300">
              Narrow the schedule by day, time, stage, or your own votes.
            </SheetDescription>
          </SheetHeader>
          <div
            className={cn(
              "grid grid-cols-1 gap-4 mt-4",
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
        </SheetContent>
      </Sheet>
    </div>
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
