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
}

/**
 * Shared day / time-of-day / stage filter trigger + bottom sheet for both
 * Schedule views, backed by the shared URL state so filters stay in sync.
 * The badge excludes vote-chip selections while logged out (inert filter).
 */
export function ScheduleFilterSheet({ tab }: ScheduleFilterSheetProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const {
    day,
    time,
    stagesIds,
    votes,
    updateDay,
    updateTime,
    updateStages,
    clearFilters,
  } = useTimelineUrlState(tab);

  const activeFilterCount =
    (day !== "all" ? 1 : 0) +
    (time !== "all" ? 1 : 0) +
    stagesIds.length +
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
          aria-label={
            hasActiveFilters
              ? `Filters (${activeFilterCount} active)`
              : "Filters"
          }
          className={
            hasActiveFilters
              ? "flex items-center gap-2 bg-accent-soft text-foreground hover:bg-accent/60"
              : "flex items-center gap-2 text-subtle-foreground hover:bg-accent-soft hover:text-foreground"
          }
        >
          <Filter className="h-4 w-4" />
          <span className="hidden md:inline">Filters</span>
          {hasActiveFilters && (
            <Badge
              variant="secondary"
              data-testid="schedule-filters-badge"
              className="bg-accent-soft text-foreground"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        data-testid="schedule-filter-sheet"
        className="bg-popover border-border max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-foreground">Filter schedule</SheetTitle>
          <SheetDescription className="text-subtle-foreground">
            Narrow the schedule by day, time of day, and stage.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <DayFilterSelect selectedDay={day} onDayChange={updateDay} />
          <TimeFilterSelect selectedTime={time} onTimeChange={updateTime} />
          <StageFilterButtons
            selectedStages={stagesIds}
            onStageToggle={handleStageToggle}
          />
        </div>

        {user && (
          <div className="mt-4 space-y-2 md:hidden">
            <label className="text-sm font-medium text-muted-foreground">
              Vote
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
              className="text-destructive hover:text-red-300 hover:bg-destructive/10"
            >
              Clear all
            </Button>
          )}
          <SheetClose asChild>
            <Button type="button" className="bg-accent hover:bg-accent-hover">
              Done
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  function handleStageToggle(stageId: string) {
    const newStages = stagesIds.includes(stageId)
      ? stagesIds.filter((id) => id !== stageId)
      : [...stagesIds, stageId];
    updateStages(newStages);
  }
}
