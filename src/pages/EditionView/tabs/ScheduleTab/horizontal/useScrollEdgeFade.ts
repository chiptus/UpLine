import { useEffect, useState } from "react";
import type { RefObject } from "react";

interface ScrollEdgeFade {
  left: boolean;
  right: boolean;
}

/**
 * Whether a horizontally-scrollable element still has more content to
 * scroll toward on each side, kept in sync via rAF-throttled scroll/resize
 * listeners. Used to fade the edges of a scrollable row as a hint that it
 * overflows, instead of an abrupt cutoff.
 *
 * `extraDeps` re-runs the sync when the element's content changes without
 * firing a scroll/resize event of its own (e.g. a day filter changing how
 * many buttons are rendered).
 */
export function useScrollEdgeFade(
  scrollRef: RefObject<HTMLElement>,
  extraDeps: unknown[] = [],
): ScrollEdgeFade {
  const [fade, setFade] = useState<ScrollEdgeFade>({
    left: false,
    right: false,
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let rafId: number | null = null;

    function sync() {
      const node = el!;
      setFade({
        left: node.scrollLeft > 1,
        right: node.scrollLeft + node.clientWidth < node.scrollWidth - 1,
      });
    }

    function scheduleSync() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        sync();
      });
    }

    sync();
    el.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      el.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollRef, ...extraDeps]);

  return fade;
}
