import { useLayoutEffect, useState } from "react";
import type { RefObject } from "react";

/**
 * The scroll container's live `scrollLeft`, kept in sync with its native
 * scroll events.
 */
export function useScrollLeft(
  scrollContainerRef: RefObject<HTMLDivElement>,
): number {
  const [scrollLeft, setScrollLeft] = useState(0);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    function handleScroll() {
      setScrollLeft(container!.scrollLeft);
    }

    // Read the initial position after useTimelineScrollSync's own mount
    // scroll (also a layout effect, run before this one) so the header
    // strip doesn't flash at translateX(0) before the first scroll event.
    setScrollLeft(container.scrollLeft);

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [scrollContainerRef]);

  return scrollLeft;
}
