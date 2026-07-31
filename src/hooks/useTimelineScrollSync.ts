import { useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { RefObject } from "react";
import {
  offsetToTime,
  timeToOffset,
  type ScheduleWindow,
} from "@/lib/timelineCalculator";
import {
  resolveTimelineMountMoment,
  roundToNearestMinutes,
} from "@/lib/timelineMountMoment";
import { TIMELINE_START_SCROLL_GUTTER_PX } from "@/lib/timelineDayJump";

const SCROLL_DEBOUNCE_MS = 300;
const SCROLL_ROUND_MINUTES = 5;

interface UseTimelineScrollSyncOptions {
  scrollContainerRef: RefObject<HTMLDivElement>;
  festivalStart: Date;
  scheduleWindow: ScheduleWindow | null;
  timezone: string;
  now: Date;
}

/**
 * One-way sync: URL -> scroll only on mount; user scroll -> URL only
 * (debounced, 5-min rounded, history replace). Never loops.
 */
export function useTimelineScrollSync({
  scrollContainerRef,
  festivalStart,
  scheduleWindow,
  timezone,
  now,
}: UseTimelineScrollSyncOptions) {
  const route =
    "/festivals/$festivalSlug/editions/$editionSlug/schedule/timeline" as const;

  const { scrollTo, day } = useSearch({
    from: route,
    select: (search) => ({ scrollTo: search.scrollTo, day: search.day }),
  });
  const navigate = useNavigate({ from: route });

  const hasCenteredOnMountRef = useRef(false);
  // Scroll events at this position are programmatic, not user scrolling.
  const programmaticScrollLeftRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (hasCenteredOnMountRef.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    hasCenteredOnMountRef.current = true;

    const moment = resolveTimelineMountMoment({
      scrollTo,
      day,
      timezone,
      festivalStart,
      scheduleWindow,
      now,
    });

    const targetScrollLeft = Math.max(
      TIMELINE_START_SCROLL_GUTTER_PX,
      timeToOffset(moment, festivalStart) - container.clientWidth / 2,
    );

    if (targetScrollLeft !== container.scrollLeft) {
      container.scrollLeft = targetScrollLeft;
      // Read back: the browser clamps scrollLeft to the scrollable range.
      programmaticScrollLeftRef.current = container.scrollLeft;
    }
    // Mount-only by design: URL -> scroll never re-runs after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollContainerRef]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    // Guards a debounced write from a stray scroll event during teardown —
    // a pathname check can't catch a goBack() back to the same URL, but
    // instance liveness can.
    let isActive = true;

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      isActive = false;
      container.removeEventListener("scroll", handleScroll);
      if (debounceTimer) clearTimeout(debounceTimer);
    };

    function handleScroll() {
      const programmaticLeft = programmaticScrollLeftRef.current;
      if (programmaticLeft !== null) {
        const el = scrollContainerRef.current;
        if (el && Math.abs(el.scrollLeft - programmaticLeft) <= 1) {
          return;
        }
        programmaticScrollLeftRef.current = null;
      }

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!isActive) return;
        const el = scrollContainerRef.current;
        if (!el) return;

        const centerOffset = el.scrollLeft + el.clientWidth / 2;
        const centerMoment = offsetToTime(centerOffset, festivalStart);
        const rounded = roundToNearestMinutes(
          centerMoment,
          SCROLL_ROUND_MINUTES,
        );

        navigate({
          to: ".",
          search: (prev) => ({ ...prev, scrollTo: rounded.toISOString() }),
          replace: true,
        });
      }, SCROLL_DEBOUNCE_MS);
    }
  }, [scrollContainerRef, festivalStart, navigate]);
}
