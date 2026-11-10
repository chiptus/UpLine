import type { Locator } from "@playwright/test";

// Longer than the 300ms scrollTo debounce, so the debounced URL write has
// fired by the time the scroll counts as idle. Time-based rather than
// frame-based so it holds on high-refresh displays.
const IDLE_MS = 400;

/**
 * Resolves once the container's horizontal scroll position has stopped
 * changing, covering both smooth-scroll animation and the debounced URL write.
 */
export async function waitForScrollIdle(scrollContainer: Locator) {
  await scrollContainer.evaluate(
    (el, idleMs) =>
      new Promise<void>((resolve) => {
        let last = el.scrollLeft;
        let lastChangeAt = performance.now();
        function tick() {
          const now = performance.now();
          if (el.scrollLeft !== last) {
            last = el.scrollLeft;
            lastChangeAt = now;
          }
          if (now - lastChangeAt >= idleMs) {
            resolve();
            return;
          }
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }),
    IDLE_MS,
  );
}
