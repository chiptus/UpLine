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
    <div className="inline-flex shrink-0 items-stretch overflow-hidden rounded-full border border-accent/60 bg-surface">
      {days.map((day, index) => {
        const isActive = day.date === activeDay;
        const parts = getFestivalDayParts(day.date);
        const breakBefore =
          index > 0 && !areFestivalDaysAdjacent(days[index - 1].date, day.date);

        return (
          <Fragment key={day.date}>
            {index > 0 && (
              <span
                aria-hidden
                className={cn(
                  "self-stretch border-l",
                  breakBefore
                    ? "border-solid border-accent/60"
                    : "border-dashed border-foreground/20",
                )}
              />
            )}
            <button
              type="button"
              role="radio"
              aria-checked={isActive}
              ref={isActive ? activeButtonRef : undefined}
              onClick={() => onJumpToDay(getDayJumpMoment(day, timezone))}
              className={cn(
                "flex min-h-9 shrink-0 items-center whitespace-nowrap px-3.5 text-[13px] transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                isActive
                  ? "bg-accent font-bold text-accent-foreground"
                  : "font-medium text-muted-foreground hover:bg-surface-active hover:text-foreground",
              )}
            >
              {parts ? (
                <>
                  {parts.weekday}
                  <span className="ml-1 tabular-nums">{parts.dayOfMonth}</span>
                </>
              ) : (
                day.displayDate
              )}
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}
