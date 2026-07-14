import { useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { RefObject } from "react";
import { offsetToTime, timeToOffset } from "@/lib/timelineCalculator";
import {
  resolveTimelineMountMoment,
  roundToNearestMinutes,
} from "@/lib/timelineMountMoment";

const SCROLL_DEBOUNCE_MS = 300;
const SCROLL_ROUND_MINUTES = 5;

interface UseTimelineScrollSyncOptions {
  scrollContainerRef: RefObject<HTMLDivElement>;
  festivalStart: Date;
  timezone: string;
}

/**
 * Owns the one-way sync between the timeline's scroll position and the
 * `scrollTo` URL param:
 *
 *   - On mount only: centers the viewport per `resolveTimelineMountMoment`'s
 *     precedence (scrollTo -> day filter -> festival start).
 *   - On user scroll: after the scroll settles (~300ms), writes the moment
 *     now centered in the viewport back to the URL (history replace),
 *     rounded to 5-minute granularity.
 *
 * These two directions never trigger each other: the mount effect runs once
 * and the scroll listener only ever navigates, never touches `scrollLeft`.
 */
export function useTimelineScrollSync({
  scrollContainerRef,
  festivalStart,
  timezone,
}: UseTimelineScrollSyncOptions) {
  const route =
    "/festivals/$festivalSlug/editions/$editionSlug/schedule/timeline" as const;

  // Narrow, structurally-shared selection: this hook only cares about
  // scrollTo/day, so its own writes to scrollTo don't cascade elsewhere.
  const { scrollTo, day } = useSearch({
    from: route,
    select: (search) => ({ scrollTo: search.scrollTo, day: search.day }),
    structuralSharing: true,
  });
  const navigate = useNavigate({ from: route });

  const hasCenteredOnMountRef = useRef(false);
  const suppressNextScrollEventRef = useRef(false);

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
    });

    const targetScrollLeft = Math.max(
      0,
      timeToOffset(moment, festivalStart) - container.clientWidth / 2,
    );

    if (targetScrollLeft !== container.scrollLeft) {
      suppressNextScrollEventRef.current = true;
      container.scrollLeft = targetScrollLeft;
    }
    // Mount-only positioning: intentionally does not re-run when scrollTo/day
    // change afterwards (one-way ownership, URL -> scroll only on mount).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollContainerRef]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    function handleScroll() {
      if (suppressNextScrollEventRef.current) {
        suppressNextScrollEventRef.current = false;
        return;
      }

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
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

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [scrollContainerRef, festivalStart, navigate]);
}
