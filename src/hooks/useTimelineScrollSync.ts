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
  // The browser can clamp scrollLeft (firing a native 'scroll' event) while
  // this route's DOM is being torn down after navigating away, even though
  // React hasn't unmounted this component yet. A debounced write scheduled
  // from that stray event would fire after the URL has already moved on,
  // calling `navigate` with a stale `from` and corrupting the in-flight
  // navigation. Guard against that by capturing this route's own pathname
  // once and bailing out of the debounced write if it no longer matches.
  const ownPathnameRef = useRef(
    typeof window === "undefined" ? "" : window.location.pathname,
  );

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

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
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
        const el = scrollContainerRef.current;
        if (!el) return;
        // We've navigated away from this route (even if this component
        // hasn't unmounted yet): don't write scrollTo for a stale route.
        if (window.location.pathname !== ownPathnameRef.current) return;

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
