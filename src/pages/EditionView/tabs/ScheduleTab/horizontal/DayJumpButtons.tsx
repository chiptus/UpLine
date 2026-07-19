import { Button } from "@/components/ui/button";
import { getFestivalDayShortLabel } from "@/lib/timeUtils";
import { getDayJumpMoment } from "@/lib/timelineDayJump";
import type { ScheduleDay } from "@/hooks/useScheduleData";

interface DayJumpButtonsProps {
  days: ScheduleDay[];
  timezone: string;
  onJumpToDay: (moment: Date) => void;
}

export function DayJumpButtons({
  days,
  timezone,
  onJumpToDay,
}: DayJumpButtonsProps) {
  return (
    <>
      {days.map((day) => (
        <Button
          key={day.date}
          type="button"
          variant="outline"
          size="sm"
          data-testid={`day-jump-button-${day.date}`}
          className="shrink-0 border-purple-400/40 text-purple-100 hover:bg-purple-400 hover:text-white"
          onClick={() => onJumpToDay(getDayJumpMoment(day, timezone))}
        >
          {getFestivalDayShortLabel(day.date) || day.displayDate}
        </Button>
      ))}
    </>
  );
}
