import { useNavigate } from "@tanstack/react-router";
import type { RefObject } from "react";
import { offsetToTime, timeToOffset } from "@/lib/timelineCalculator";
import { roundToNearestMinutes } from "@/lib/timelineMountMoment";

const SCROLL_ROUND_MINUTES = 5;

interface UseTimelineJumpOptions {
  scrollContainerRef: RefObject<HTMLDivElement>;
  festivalStart: Date;
}

/**
 * Imperative jump to a moment on the timeline: smooth-scrolls the viewport
 * there and writes the settled `scrollTo` URL param (history replace).
 * Separate from `useTimelineScrollSync`'s passive URL <-> scroll sync.
 */
export function useTimelineJump({
  scrollContainerRef,
  festivalStart,
}: UseTimelineJumpOptions) {
  const route =
    "/festivals/$festivalSlug/editions/$editionSlug/schedule/timeline" as const;
  const navigate = useNavigate({ from: route });

  function jumpTo(moment: Date) {
    const container = scrollContainerRef.current;
    if (!container) return;

    const rounded = roundToNearestMinutes(moment, SCROLL_ROUND_MINUTES);
    const targetScrollLeft = Math.max(
      0,
      timeToOffset(rounded, festivalStart) - container.clientWidth / 2,
    );
    // A clamped target (e.g. first-day jump) centers on a different moment
    // than requested; write the one the viewport actually settles on.
    const settledMoment = roundToNearestMinutes(
      offsetToTime(targetScrollLeft + container.clientWidth / 2, festivalStart),
      SCROLL_ROUND_MINUTES,
    );

    container.scrollTo({ left: targetScrollLeft, behavior: "smooth" });

    navigate({
      to: ".",
      search: (prev) => ({ ...prev, scrollTo: settledMoment.toISOString() }),
      replace: true,
    });
  }

  return { jumpTo };
}
