import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { timeToOffset } from "@/lib/timelineCalculator";
import {
  DAY_JUMP_START_GUTTER_PX,
  getDayJumpMoment,
} from "@/lib/timelineDayJump";
import type { ScheduleDay } from "./useScheduleData";

interface UseActiveTimelineDayOptions {
  scrollContainerRef: RefObject<HTMLDivElement>;
  days: ScheduleDay[];
  timezone: string;
  dayStartHour: number;
  festivalStart: Date;
}

/**
 * Tracks which day's jump button should read as "current": the last day
 * boundary the viewport has scrolled past, so the toolbar's active state
 * follows the strip instead of staying pinned to whatever loaded first.
 */
export function useActiveTimelineDay({
  scrollContainerRef,
  days,
  timezone,
  dayStartHour,
  festivalStart,
}: UseActiveTimelineDayOptions) {
  const [activeDate, setActiveDate] = useState<string | null>(
    days[0]?.date ?? null,
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || days.length === 0) return;

    // Match the scroll position a "start"-aligned jump actually lands on
    // (see jumpToTimelineMoment), so a day reads as active immediately after
    // jumping to it rather than lagging one day behind.
    const boundaries = days
      .map((day) => ({
        date: day.date,
        offset: Math.max(
          0,
          timeToOffset(
            getDayJumpMoment(day, timezone, dayStartHour),
            festivalStart,
          ) - DAY_JUMP_START_GUTTER_PX,
        ),
      }))
      .sort((a, b) => a.offset - b.offset);

    function updateActiveDay() {
      const el = scrollContainerRef.current;
      if (!el) return;

      const current = boundaries.reduce((closest, boundary) =>
        boundary.offset <= el.scrollLeft ? boundary : closest,
      );
      setActiveDate(current.date);
    }

    updateActiveDay();
    container.addEventListener("scroll", updateActiveDay, { passive: true });
    return () => container.removeEventListener("scroll", updateActiveDay);
  }, [scrollContainerRef, days, timezone, dayStartHour, festivalStart]);

  return activeDate;
}
