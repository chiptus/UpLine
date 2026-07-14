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
  festivalEnd: Date;
  timezone: string;
  /** Current moment, injected by the caller (see `useNow`). Only read once,
   * at mount, to resolve the "now" mount-precedence rule. */
  now: Date;
}

/**
 * Owns the one-way sync between the timeline's scroll position and the
 * `scrollTo` URL param:
 *
 *   - On mount only: centers the viewport per `resolveTimelineMountMoment`'s
 *     precedence (scrollTo -> day filter -> now-1h inside the festival
 *     window -> festival start).
 *   - On user scroll: after the scroll settles (~300ms), writes the moment
 *     now centered in the viewport back to the URL (history replace),
 *     rounded to 5-minute granularity.
 *   - On demand, via the returned `jumpTo(moment)`: writes `scrollTo`
 *     immediately (history replace) and smooth-scrolls the container to
 *     center that moment. The scroll events fired mid-animation keep
 *     resetting the debounce above, so no intermediate value is written;
 *     once the animation settles, the debounce fires once more and writes
 *     back the actual centered moment, which lands on the same value (no
 *     feedback loop, no history spam - both writes use `replace`).
 *
 * These directions never trigger each other into a loop: the mount effect
 * runs once, the scroll listener only ever navigates (never touches
 * `scrollLeft`), and `jumpTo` is the only path that both navigates and
 * scrolls, driven solely by explicit calls (day-jump toolbar clicks).
 */
export function useTimelineScrollSync({
  scrollContainerRef,
  festivalStart,
  festivalEnd,
  timezone,
  now,
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
  // Position of the last programmatic scroll; scroll events reporting this
  // position are ignored (a browser may fire more than one for a single
  // scrollLeft write), so only genuine user scrolling reaches the URL.
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
      festivalEnd,
      now,
    });

    const targetScrollLeft = Math.max(
      0,
      timeToOffset(moment, festivalStart) - container.clientWidth / 2,
    );

    if (targetScrollLeft !== container.scrollLeft) {
      programmaticScrollLeftRef.current = targetScrollLeft;
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

  function jumpTo(moment: Date) {
    const container = scrollContainerRef.current;
    if (!container) return;

    const rounded = roundToNearestMinutes(moment, SCROLL_ROUND_MINUTES);
    const targetScrollLeft = Math.max(
      0,
      timeToOffset(rounded, festivalStart) - container.clientWidth / 2,
    );
    // Write the moment the viewport actually settles on: when the target
    // clamps at the strip start (e.g. jumping to the first day), the real
    // center differs from the requested moment, and the post-scroll
    // debounced write must land on the same value.
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
