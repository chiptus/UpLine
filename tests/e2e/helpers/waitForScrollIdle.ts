import type { Locator } from "@playwright/test";

// Frames of unchanged scrollLeft that must pass before the scroll counts as
// idle. 24 frames is ~400ms at 60Hz, longer than the 300ms scrollTo debounce,
// so the debounced URL write has fired by the time this resolves.
const IDLE_FRAMES = 24;

/**
 * Resolves once the container's horizontal scroll position has stopped
 * changing, covering both smooth-scroll animation and the debounced URL write.
 */
export async function waitForScrollIdle(scrollContainer: Locator) {
  await scrollContainer.evaluate(
    (el, idleFrames) =>
      new Promise<void>((resolve) => {
        let last = el.scrollLeft;
        let stableFrames = 0;
        function tick() {
          if (el.scrollLeft === last) {
            stableFrames += 1;
          } else {
            last = el.scrollLeft;
            stableFrames = 0;
          }
          if (stableFrames >= idleFrames) {
            resolve();
            return;
          }
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }),
    IDLE_FRAMES,
  );
}
