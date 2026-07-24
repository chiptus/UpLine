// PROTOTYPE — "autohide" variant: hide fixed chrome while scrolling down,
// bring it back on scroll up or near the top. See chromeVariant.tsx.
import { useEffect, useState } from "react";

export function useHideOnScrollDown(threshold = 80) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;

    function handleScroll() {
      const y = window.scrollY;
      if (y <= threshold) {
        setHidden(false);
      } else if (Math.abs(y - lastY) > 4) {
        setHidden(y > lastY);
      }
      lastY = y;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return hidden;
}
