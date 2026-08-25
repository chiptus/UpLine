import { Fragment, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { areFestivalDaysAdjacent, getFestivalDayParts } from "@/lib/timeUtils";
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
  const activeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeButtonRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeDay]);

  return (
    <>
      {days.map((day, index) => {
        const isActive = day.date === activeDay;
        const parts = getFestivalDayParts(day.date);
        const breakBefore =
          index > 0 && !areFestivalDaysAdjacent(days[index - 1].date, day.date);

        return (
          <Fragment key={day.date}>
            {breakBefore && (
              <span
                aria-hidden
                className="mx-1 w-px shrink-0 self-stretch bg-border"
              />
            )}
            <button
              type="button"
              role="radio"
              aria-checked={isActive}
              ref={isActive ? activeButtonRef : undefined}
              onClick={() => onJumpToDay(getDayJumpMoment(day, timezone))}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-center transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "border-transparent bg-accent text-accent-foreground"
                  : "border-border bg-surface text-muted-foreground hover:bg-surface-active hover:text-foreground",
              )}
            >
              {parts ? (
                <>
                  <span className="block font-display text-[10px] font-medium uppercase tracking-[0.14em]">
                    {parts.weekday}
                  </span>
                  <span className="block text-base font-semibold leading-none tabular-nums">
                    {parts.dayOfMonth}
                  </span>
                </>
              ) : (
                <span className="block text-sm font-medium">
                  {day.displayDate}
                </span>
              )}
            </button>
          </Fragment>
        );
      })}
    </>
  );
}
