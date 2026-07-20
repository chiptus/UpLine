import { useEffect, useState } from "react";
import type { RefObject } from "react";

interface TimelineViewportSize {
  scrollLeft: number;
  clientWidth: number;
}

/**
 * The timeline scroll container's current visible span - how far scrolled,
 * how much is visible - kept in sync via rAF-throttled scroll/resize
 * listeners. Used to position the overview mini-map's draggable viewport
 * window.
 */
export function useTimelineViewportSize(
  scrollContainerRef: RefObject<HTMLDivElement>,
): TimelineViewportSize {
  const [viewportSize, setViewportSize] = useState<TimelineViewportSize>(() =>
    readViewportSize(scrollContainerRef.current),
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let rafId: number | null = null;

    function sync() {
      setViewportSize(readViewportSize(container));
    }

    function scheduleSync() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        sync();
      });
    }

    sync();
    container.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      container.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
    };
  }, [scrollContainerRef]);

  return viewportSize;
}

function readViewportSize(
  container: HTMLDivElement | null,
): TimelineViewportSize {
  return {
    scrollLeft: container?.scrollLeft ?? 0,
    clientWidth: container?.clientWidth ?? 0,
  };
}
