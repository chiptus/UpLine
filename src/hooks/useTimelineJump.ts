import type { RefObject } from "react";
import { timeToOffset } from "@/lib/timelineCalculator";
import { roundToNearestMinutes } from "@/lib/timelineMountMoment";
import { DAY_JUMP_START_GUTTER_PX } from "@/lib/timelineDayJump";

const SCROLL_ROUND_MINUTES = 5;

interface UseTimelineJumpOptions {
  scrollContainerRef: RefObject<HTMLDivElement>;
  festivalStart: Date;
}

interface JumpToOptions {
  /** "center" (default) puts the moment mid-viewport; "start" left-aligns
   * it, offset by a gutter that clears the pinned stage-name column. */
  align?: "center" | "start";
}

/**
 * Imperative jump to a moment on the timeline: smooth-scrolls the viewport
 * there. The `scrollTo` URL param is written by `useTimelineScrollSync`'s
 * scroll listener once the animation settles — no separate write needed here.
 */
export function useTimelineJump({
  scrollContainerRef,
  festivalStart,
}: UseTimelineJumpOptions) {
  function jumpTo(moment: Date, options: JumpToOptions = {}) {
    const container = scrollContainerRef.current;
    if (!container) return;

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

  return { jumpTo };
}
