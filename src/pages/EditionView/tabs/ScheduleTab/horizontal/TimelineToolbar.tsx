import { Map } from "lucide-react";
import { DayJumpButtons } from "./DayJumpButtons";
import { Button } from "@/components/ui/button";
import type { ScheduleDay } from "@/hooks/useScheduleData";

interface TimelineToolbarProps {
  days: ScheduleDay[];
  selectedDay: string;
  activeDay: string | null;
  timezone: string;
  onJumpToDay: (moment: Date) => void;
  isOverviewExpanded: boolean;
  onToggleOverview: () => void;
}

// Sticky nav toolbar above the Timeline strip. Navigation scrolls, it never
// filters; with a day filter active only that day's button shows.
export function TimelineToolbar({
  days,
  selectedDay,
  activeDay,
  timezone,
  onJumpToDay,
  isOverviewExpanded,
  onToggleOverview,
}: TimelineToolbarProps) {
  const visibleDays =
    selectedDay === "all"
      ? days
      : days.filter((day) => day.date === selectedDay);

  if (visibleDays.length === 0) return null;

  return (
    <div
      data-testid="timeline-day-toolbar"
      className="sticky top-0 z-40 mb-4 flex items-end gap-1 rounded-lg border border-purple-400/20 bg-gray-900/95 px-2 pb-2.5 pt-2 backdrop-blur-md"
    >
      <div
        role="radiogroup"
        aria-label="Jump to day"
        className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto"
      >
        <DayJumpButtons
          days={visibleDays}
          activeDay={activeDay}
          timezone={timezone}
          onJumpToDay={onJumpToDay}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        data-testid="timeline-overview-toggle"
        className="shrink-0 gap-1.5 self-center border-l border-purple-400/20 pl-3 text-purple-200/60 hover:bg-purple-400/10 hover:text-purple-100"
        aria-expanded={isOverviewExpanded}
        aria-label={isOverviewExpanded ? "Hide overview" : "Show overview"}
        onClick={onToggleOverview}
      >
        <Map className="size-4" />
        <span className="hidden sm:inline">
          {isOverviewExpanded ? "Hide overview" : "Show overview"}
        </span>
      </Button>
    </div>
  );
}
