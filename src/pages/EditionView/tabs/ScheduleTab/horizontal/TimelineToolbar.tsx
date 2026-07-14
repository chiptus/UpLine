import { DayJumpButtons } from "./DayJumpButtons";
import type { ScheduleDay } from "@/hooks/useScheduleData";

interface TimelineToolbarProps {
  days: ScheduleDay[];
  selectedDay: string;
  timezone: string;
  onJumpToDay: (moment: Date) => void;
}

/**
 * Slim sticky toolbar above the Timeline strip. Only hosts day-jump buttons
 * for now; the Now pill, "Show overview" toggle, and Filters trigger
 * (upcoming stacked tickets) will render alongside them here.
 *
 * Navigation only ever scrolls - it never filters the strip. When a `day`
 * filter is active, nav operates on what's rendered, so only that day's
 * button shows.
 */
export function TimelineToolbar({
  days,
  selectedDay,
  timezone,
  onJumpToDay,
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
    </div>
  );
}
