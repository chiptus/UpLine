import { DayJumpButtons } from "./DayJumpButtons";
import { Button } from "@/components/ui/button";
import type { ScheduleDay } from "@/hooks/useScheduleData";

interface TimelineToolbarProps {
  days: ScheduleDay[];
  selectedDay: string;
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
      className="sticky top-0 z-40 mb-4 flex gap-2 overflow-x-auto rounded-lg border border-purple-400/20 bg-gray-900/95 p-2 backdrop-blur-md"
    >
      <DayJumpButtons
        days={visibleDays}
        timezone={timezone}
        onJumpToDay={onJumpToDay}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="timeline-overview-toggle"
        className="ml-auto shrink-0 border-purple-400/40 text-purple-100 hover:bg-purple-400 hover:text-white"
        onClick={onToggleOverview}
      >
        {isOverviewExpanded ? "Hide overview" : "Show overview"}
      </Button>
    </div>
  );
}
