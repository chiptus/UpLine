import { DayJumpButtons } from "./DayJumpButtons";
import { NowButton } from "./NowButton";
import type { ScheduleDay } from "@/hooks/useScheduleData";

interface TimelineToolbarProps {
  days: ScheduleDay[];
  selectedDay: string;
  timezone: string;
  onJumpToDay: (moment: Date) => void;
  showNowButton: boolean;
  onJumpToNow: () => void;
}

/**
 * Slim sticky toolbar above the Timeline strip. Hosts day-jump buttons and
 * the Now pill; the "Show overview" toggle and Filters trigger (upcoming
 * stacked tickets) will render alongside them here.
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
  showNowButton,
  onJumpToNow,
}: TimelineToolbarProps) {
  const visibleDays =
    selectedDay === "all"
      ? days
      : days.filter((day) => day.date === selectedDay);

  if (visibleDays.length === 0 && !showNowButton) return null;

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
      {showNowButton && <NowButton onJumpToNow={onJumpToNow} />}
    </div>
  );
}
