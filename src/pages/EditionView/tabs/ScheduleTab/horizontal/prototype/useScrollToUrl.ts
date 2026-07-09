// PROTOTYPE (timeline nav & filtering) — throwaway, delete with this folder.
//
// The agreed `scrollTo` URL mechanics, shared by all variants:
// - `scrollTo=<yyyy-MM-dd'T'HH:mm>` (festival-timezone wall clock) = the moment
//   at the viewport center. Absent by default.
// - User scroll writes it debounced (~300ms scroll-idle), rounded to 5 minutes,
//   via history replace.
// - One-way ownership: URL -> scroll only on mount and on jump-control clicks;
//   user scroll -> URL only.
import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const PX_PER_MINUTE = 2;
export const CONTENT_OFFSET_PX = 20;

const ROUTE =
  "/festivals/$festivalSlug/editions/$editionSlug/schedule/timeline" as const;

const SCROLL_IDLE_MS = 300;
const PROGRAMMATIC_SETTLE_MS = 300;
const FIVE_MINUTES_MS = 5 * 60_000;

interface UseScrollToUrlOptions {
  scrollRef: React.RefObject<HTMLDivElement>;
  festivalStart: Date;
  timezone: string;
  smooth: boolean;
  // Mount precedence when no scrollTo param: this moment lands at the left
  // edge (day-filter start, or fake-now minus 1h); null = stay at festival start.
  mountFallbackLeftEdge: Date | null;
  onCenterChange?: (center: Date) => void;
}

function parseScrollTo(
  value: string | undefined,
  timezone: string,
): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = fromZonedTime(value, timezone);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function useScrollToUrl({
  scrollRef,
  festivalStart,
  timezone,
  smooth,
  mountFallbackLeftEdge,
  onCenterChange,
}: UseScrollToUrlOptions) {
  const { scrollTo } = useSearch({ from: ROUTE });
  const navigate = useNavigate({ from: ROUTE });

  // Axis bounds change when filters change; callbacks read the latest values.
  const latest = useRef({
    festivalStart,
    timezone,
    smooth,
    scrollTo,
    mountFallbackLeftEdge,
    onCenterChange,
  });
  latest.current = {
    festivalStart,
    timezone,
    smooth,
    scrollTo,
    mountFallbackLeftEdge,
    onCenterChange,
  };

  const isProgrammatic = useRef(false);
  const programmaticTimer = useRef<number>();
  const writeTimer = useRef<number>();

  const timeToPx = useCallback((t: Date) => {
    return (
      ((t.getTime() - latest.current.festivalStart.getTime()) / 60_000) *
        PX_PER_MINUTE +
      CONTENT_OFFSET_PX
    );
  }, []);

  const centerTimeAt = useCallback((scrollLeft: number) => {
    const el = scrollRef.current;
    if (!el) return null;
    const centerPx = scrollLeft + el.clientWidth / 2 - CONTENT_OFFSET_PX;
    return new Date(
      latest.current.festivalStart.getTime() +
        (centerPx / PX_PER_MINUTE) * 60_000,
    );
  }, [scrollRef]);

  const writeScrollTo = useCallback(
    (center: Date) => {
      const rounded = new Date(
        Math.round(center.getTime() / FIVE_MINUTES_MS) * FIVE_MINUTES_MS,
      );
      const value = formatInTimeZone(
        rounded,
        latest.current.timezone,
        "yyyy-MM-dd'T'HH:mm",
      );
      navigate({
        to: ".",
        search: (prev) => ({ ...prev, scrollTo: value }),
        replace: true,
      });
    },
    [navigate],
  );

  const markProgrammatic = useCallback(() => {
    isProgrammatic.current = true;
    window.clearTimeout(programmaticTimer.current);
    programmaticTimer.current = window.setTimeout(() => {
      isProgrammatic.current = false;
    }, PROGRAMMATIC_SETTLE_MS);
  }, []);

  const scrollToPx = useCallback(
    (left: number) => {
      const el = scrollRef.current;
      if (!el) return;
      markProgrammatic();
      el.scrollTo({
        left: Math.max(0, left),
        behavior: latest.current.smooth ? "smooth" : "auto",
      });
    },
    [scrollRef, markProgrammatic],
  );

  // Jump controls: write scrollTo + scroll. One code path for day/Now buttons.
  const jumpToCenter = useCallback(
    (t: Date) => {
      const el = scrollRef.current;
      if (!el) return;
      writeScrollTo(t);
      scrollToPx(timeToPx(t) - el.clientWidth / 2);
    },
    [scrollRef, writeScrollTo, scrollToPx, timeToPx],
  );

  const jumpToLeftEdge = useCallback(
    (t: Date) => {
      const el = scrollRef.current;
      if (!el) return;
      const left = timeToPx(t) - 12;
      const center = centerTimeAt(Math.max(0, left));
      if (center) writeScrollTo(center);
      scrollToPx(left);
    },
    [scrollRef, timeToPx, centerTimeAt, writeScrollTo, scrollToPx],
  );

  // User scroll -> URL (debounced); programmatic scrolls only reset the flag.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function handleScroll() {
      const center = centerTimeAt(el!.scrollLeft);
      if (center) latest.current.onCenterChange?.(center);

      if (isProgrammatic.current) {
        window.clearTimeout(programmaticTimer.current);
        programmaticTimer.current = window.setTimeout(() => {
          isProgrammatic.current = false;
        }, PROGRAMMATIC_SETTLE_MS);
        return;
      }
      window.clearTimeout(writeTimer.current);
      writeTimer.current = window.setTimeout(() => {
        const idleCenter = centerTimeAt(el!.scrollLeft);
        if (idleCenter) writeScrollTo(idleCenter);
      }, SCROLL_IDLE_MS);
    }

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.clearTimeout(writeTimer.current);
      window.clearTimeout(programmaticTimer.current);
    };
  }, [scrollRef, centerTimeAt, writeScrollTo]);

  // URL -> scroll, once on mount only. Precedence:
  // scrollTo param -> centered; else fallback (day start / now-1h) -> left edge.
  const didPosition = useRef(false);
  useEffect(() => {
    if (didPosition.current) return;
    didPosition.current = true;
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTo: param, timezone: tz, mountFallbackLeftEdge: fallback } =
      latest.current;
    const target = parseScrollTo(param, tz);
    let left: number | null = null;
    if (target) {
      left = timeToPx(target) - el.clientWidth / 2;
    } else if (fallback) {
      left = timeToPx(fallback) - 12;
    }
    if (left !== null) {
      markProgrammatic();
      el.scrollLeft = Math.max(0, left);
    }
    const center = centerTimeAt(el.scrollLeft);
    if (center) latest.current.onCenterChange?.(center);
  }, [scrollRef, timeToPx, centerTimeAt, markProgrammatic]);

  return { jumpToCenter, jumpToLeftEdge };
}
