import { useCallback, useState } from "react";

/**
 * Live border-box height of an element, kept in sync via ResizeObserver.
 * Returns a callback ref (not a RefObject) so measurement starts whenever the
 * element mounts, including when it renders conditionally after first paint.
 */
export function useElementHeight(): [(el: HTMLElement | null) => void, number] {
  const [height, setHeight] = useState(0);
  const [observer] = useState(() =>
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(([entry]) => {
          if (!entry) return;
          const box = entry.borderBoxSize?.[0];
          setHeight(
            box ? box.blockSize : entry.target.getBoundingClientRect().height,
          );
        }),
  );

  const ref = useCallback(
    (el: HTMLElement | null) => {
      observer?.disconnect();
      if (!el) {
        setHeight(0);
        return;
      }
      setHeight(el.getBoundingClientRect().height);
      observer?.observe(el);
    },
    [observer],
  );

  return [ref, height];
}
