import { useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DayFilterSelect } from "./DayFilterSelect";
import { TimeFilterSelect } from "./TimeFilterSelect";
import { StageFilterButtons } from "./StageFilterButtons";
import { VoteFilterChips } from "./VoteFilterChips";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import { useAuth } from "@/contexts/AuthContext";

interface ScheduleFilterSheetProps {
  tab: "timeline" | "list";
  /** PROTOTYPE: always show the "Filters" text, not only on md+. */
  showLabel?: boolean;
}

/**
 * Shared day / time-of-day / stage filter trigger + bottom sheet for both
 * Schedule views, backed by the shared URL state so filters stay in sync.
 * The badge excludes vote-chip selections while logged out (inert filter).
 */
export function ScheduleFilterSheet({
  tab,
  showLabel,
}: ScheduleFilterSheetProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const {
    day,
    time,
    stages,
    votes,
    updateDay,
    updateTime,
    updateStages,
    clearFilters,
  } = useTimelineUrlState(tab);

  const activeFilterCount =
    (day !== "all" ? 1 : 0) +
    (time !== "all" ? 1 : 0) +
    stages.length +
    (user ? votes.length : 0);
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-testid="schedule-filters-trigger"
          className={
            hasActiveFilters
              ? "flex items-center gap-2 bg-purple-600/50 text-purple-100 hover:bg-purple-600/60"
              : "flex items-center gap-2 text-purple-300 hover:bg-purple-400/10 hover:text-purple-100"
          }
        >
          <Filter className="h-4 w-4" />
          <span className={showLabel ? undefined : "hidden md:inline"}>
            Filters
          </span>
          {hasActiveFilters && (
            <Badge
              variant="secondary"
              data-testid="schedule-filters-badge"
              className="bg-purple-800/50 text-purple-100"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        data-testid="schedule-filter-sheet"
        className="bg-gray-900 border-purple-400/30 max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-purple-100">Filter schedule</SheetTitle>
          <SheetDescription className="text-purple-300">
            Narrow the schedule by day, time of day, and stage.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <DayFilterSelect selectedDay={day} onDayChange={updateDay} />
          <TimeFilterSelect selectedTime={time} onTimeChange={updateTime} />
          <StageFilterButtons
            selectedStages={stages}
            onStageToggle={handleStageToggle}
          />
        </div>

        {user && (
          <div className="mt-4 space-y-2 md:hidden">
            <label className="text-sm font-medium text-purple-200">
              My vote
            </label>
            <VoteFilterChips tab={tab} />
          </div>
        )}

        <SheetFooter className="mt-6">
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
              data-testid="schedule-filters-clear"
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
            >
              Clear all
            </Button>
          )}
          <SheetClose asChild>
            <Button type="button" className="bg-purple-600 hover:bg-purple-700">
              Done
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  function handleStageToggle(stageId: string) {
    const newStages = stages.includes(stageId)
      ? stages.filter((id) => id !== stageId)
      : [...stages, stageId];
    updateStages(newStages);
  }
}
