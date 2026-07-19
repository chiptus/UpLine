import type { RefObject } from "react";
import { timeToOffset } from "@/lib/timelineCalculator";
import { roundToNearestMinutes } from "@/lib/timelineMountMoment";

const SCROLL_ROUND_MINUTES = 5;

interface UseTimelineJumpOptions {
  scrollContainerRef: RefObject<HTMLDivElement>;
  festivalStart: Date;
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
  function jumpTo(moment: Date) {
    const container = scrollContainerRef.current;
    if (!container) return;

    const rounded = roundToNearestMinutes(moment, SCROLL_ROUND_MINUTES);
    const targetScrollLeft = Math.max(
      0,
      timeToOffset(rounded, festivalStart) - container.clientWidth / 2,
    );

    container.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
  }

  return { jumpTo };
}
