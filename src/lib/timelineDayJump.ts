import { fromZonedTime } from "date-fns-tz";
import { timeToOffset } from "@/lib/timelineCalculator";
import { roundToNearestMinutes } from "@/lib/timelineMountMoment";
import type { ScheduleDay } from "@/hooks/useScheduleData";

// Clears the pinned StageLabels column (absolute, up to ~180px wide for long
// stage names) so a left-aligned day jump doesn't land a set's card under it.
// Shared by jumpToTimelineMoment (to compute the scroll target) and
// useActiveTimelineDay (to compute matching day boundaries), so the two never drift.
export const DAY_JUMP_START_GUTTER_PX = 190;

const SCROLL_ROUND_MINUTES = 5;

interface JumpToMomentOptions {
  /** "center" (default) puts the moment mid-viewport; "start" left-aligns
   * it, offset by a gutter that clears the pinned stage-name column. */
  align?: "center" | "start";
}

/**
 * Imperative jump to a moment on the timeline: smooth-scrolls `container`
 * there. The `scrollTo` URL param is written by `useTimelineScrollSync`'s
 * scroll listener once the animation settles — no separate write needed here.
 */
export function jumpToTimelineMoment(
  container: HTMLElement,
  festivalStart: Date,
  moment: Date,
  options: JumpToMomentOptions = {},
) {
  const rounded = roundToNearestMinutes(moment, SCROLL_ROUND_MINUTES);
  const offset = timeToOffset(rounded, festivalStart);
  const targetScrollLeft = Math.max(
    0,
    options.align === "start"
      ? offset - DAY_JUMP_START_GUTTER_PX
      : offset - container.clientWidth / 2,
  );

  container.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
}

/**
 * The moment a day jump centers on: the day's earliest set start (midnight
 * is usually dead timeline), falling back to festival-timezone midnight.
 */
export function getDayJumpMoment(day: ScheduleDay, timezone: string): Date {
  let earliestSetStart: Date | null = null;

  day.stages.forEach((stage) => {
    stage.sets.forEach((set) => {
      if (
        set.startTime &&
        (!earliestSetStart || set.startTime < earliestSetStart)
      ) {
        earliestSetStart = set.startTime;
      }
    });
  });

  return earliestSetStart ?? fromZonedTime(`${day.date}T00:00:00`, timezone);
}
