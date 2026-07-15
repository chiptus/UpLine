import { DayJumpButtons } from "./DayJumpButtons";
import type { ScheduleDay } from "@/hooks/useScheduleData";

interface TimelineToolbarProps {
  days: ScheduleDay[];
  selectedDay: string;
  timezone: string;
  onJumpToDay: (moment: Date) => void;
}

// Sticky nav toolbar above the Timeline strip. Navigation scrolls, it never
// filters; with a day filter active only that day's button shows.
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
