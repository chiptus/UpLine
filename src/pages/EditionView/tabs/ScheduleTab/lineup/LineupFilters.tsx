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
import { DayFilterSelect } from "../DayFilterSelect";
import { StageFilterButtons } from "../StageFilterButtons";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { cn } from "@/lib/utils";

interface LineupFiltersProps {
  tab: "timeline" | "list";
}

export function LineupFilters({ tab }: LineupFiltersProps) {
  const [open, setOpen] = useState(false);
  const { canShowStage } = useScheduleReveal();
  const { day, stagesIds, updateDay, updateStages, clearFilters } =
    useTimelineUrlState(tab);

  function handleStageToggle(stageId: string) {
    const newStages = stagesIds.includes(stageId)
      ? stagesIds.filter((id) => id !== stageId)
      : [...stagesIds, stageId];
    updateStages(newStages);
  }

  const activeFilterCount =
    (day !== "all" ? 1 : 0) + (canShowStage ? stagesIds.length : 0);
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
            {canShowStage
              ? "Narrow the schedule by day and stage."
              : "Narrow the schedule by day."}
          </SheetDescription>
        </SheetHeader>

        <div
          className={cn(
            "mt-4 grid grid-cols-1 gap-4",
            canShowStage && "md:grid-cols-2",
          )}
        >
          <DayFilterSelect selectedDay={day} onDayChange={updateDay} />
          {canShowStage && (
            <StageFilterButtons
              selectedStages={stagesIds}
              onStageToggle={handleStageToggle}
            />
          )}
        </div>

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
}
