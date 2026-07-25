import { useEffect, useState } from "react";

// Hides while scrolling down past `threshold`, returns on any scroll-up or
// once back near the top. The 4px jitter guard avoids flicker from
// sub-pixel/inertial scroll noise.
const SCROLL_JITTER_GUARD_PX = 4;

export function useHideOnScrollDown(threshold = 80) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;

    function handleScroll() {
      const y = window.scrollY;
      if (y <= threshold) {
        setHidden(false);
      } else if (Math.abs(y - lastY) > SCROLL_JITTER_GUARD_PX) {
        setHidden(y > lastY);
      }
      lastY = y;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return hidden;
}
