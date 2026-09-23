import { timeToOffset } from "@/lib/timelineCalculator";
import { roundToNearestMinutes } from "@/lib/timelineMountMoment";
import { festivalDayStart } from "@/lib/timeUtils";
import type { ScheduleDay } from "@/hooks/useScheduleData";

// Clears the pinned StageLabels column (absolute, up to ~180px wide for long
// stage names) so a left-aligned day jump doesn't land a set's card under it.
// Shared by jumpToTimelineMoment (to compute the scroll target) and
// useActiveTimelineDay (to compute matching day boundaries), so the two never drift.
export const DAY_JUMP_START_GUTTER_PX = 0;

// Keeps the scroll target off the timeline's true left edge, so the
// leftmost hour-tick's label always has room to render without clipping.
export const TIMELINE_START_SCROLL_GUTTER_PX = 20;

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
    options.align === "start" ? 0 : TIMELINE_START_SCROLL_GUTTER_PX,
    options.align === "start"
      ? offset - DAY_JUMP_START_GUTTER_PX
      : offset - container.clientWidth / 2,
  );

  container.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
}

/**
 * The moment a day jump centers on: the modal opening — the time the most
 * stages start their first set. Using the modal (rather than the global
 * earliest) skips sparse overnight/pre-dawn sets that would otherwise land the
 * jump on dead timeline at the far-left edge. Falls back to festival-timezone
 * midnight when the day has no sets.
 */
export function getDayJumpMoment(
  day: ScheduleDay,
  timezone: string,
  dayStartHour: number = 0,
): Date {
  const stageOpenings = day.stages
    .map((stage) =>
      stage.sets.reduce<Date | null>(
        (earliest, set) =>
          set.startTime && (!earliest || set.startTime < earliest)
            ? set.startTime
            : earliest,
        null,
      ),
    )
    .filter((start): start is Date => start !== null);

  return (
    mostCommonStart(stageOpenings) ??
    festivalDayStart(day.date, timezone, dayStartHour)
  );
}

// The start time shared by the most stages, tie-broken by the earliest time.
function mostCommonStart(starts: Date[]): Date | null {
  const counts = new Map<number, { count: number; date: Date }>();
  starts.forEach((date) => {
    const entry = counts.get(date.getTime());
    if (entry) {
      entry.count += 1;
    } else {
      counts.set(date.getTime(), { count: 1, date });
    }
  });

  let best: { count: number; date: Date } | null = null;
  for (const entry of counts.values()) {
    if (
      !best ||
      entry.count > best.count ||
      (entry.count === best.count && entry.date < best.date)
    ) {
      best = entry;
    }
  }

  return best?.date ?? null;
}
