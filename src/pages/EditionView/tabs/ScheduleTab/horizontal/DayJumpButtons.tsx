import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getFestivalDayShortLabel } from "@/lib/timeUtils";
import { getDayJumpMoment } from "@/lib/timelineDayJump";
import type { ScheduleDay } from "@/hooks/useScheduleData";

interface DayJumpButtonsProps {
  days: ScheduleDay[];
  activeDay: string | null;
  timezone: string;
  onJumpToDay: (moment: Date) => void;
}

export function DayJumpButtons({
  days,
  activeDay,
  timezone,
  onJumpToDay,
}: DayJumpButtonsProps) {
  return (
    <>
      {days.map((day) => {
        const isActive = day.date === activeDay;

        return (
          <Button
            key={day.date}
            type="button"
            variant="outline"
            size="sm"
            role="radio"
            aria-checked={isActive}
            className={cn(
              "shrink-0 border-purple-400/40 bg-transparent text-purple-100 hover:bg-purple-400 hover:text-white",
              isActive && "border-purple-400 bg-purple-500 text-white",
            )}
            onClick={() => onJumpToDay(getDayJumpMoment(day, timezone))}
          >
            {getFestivalDayShortLabel(day.date) || day.displayDate}
          </Button>
        );
      })}
    </>
  );
}
