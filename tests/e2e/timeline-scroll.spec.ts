import { test, expect, type Page } from "@playwright/test";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025".
const TIMELINE_PATH = "/festivals/test/editions/2025/schedule/timeline";
// Comfortably past the ~300ms scroll->URL debounce. Uses real time rather than
// a fake clock: installing a fake clock stalls the timers the data fetch and
// re-navigations depend on, which prevents the timeline from rendering.
const SCROLL_DEBOUNCE_WAIT_MS = 600;

async function openTimeline(page: Page) {
  await page.goto(TIMELINE_PATH);

  const scrollContainer = page.getByTestId("timeline-scroll-container");
  await expect(scrollContainer).toBeVisible({ timeout: 15000 });

  return scrollContainer;
}

test.describe("Timeline scroll position (scrollTo URL state)", () => {
  test("untouched timeline has no scrollTo in the URL", async ({ page }) => {
    await openTimeline(page);

    expect(new URL(page.url()).searchParams.has("scrollTo")).toBe(false);
  });

  test("scrolling writes a debounced, rounded scrollTo via history replace", async ({
    page,
  }) => {
    const scrollContainer = await openTimeline(page);

    const historyLengthBeforeScroll = await page.evaluate(
      () => window.history.length,
    );

    await scrollContainer.evaluate((el) => {
      el.scrollLeft = el.scrollLeft + 400;
    });

    // No write yet: still inside the debounce window.
    await page.waitForTimeout(100);
    expect(new URL(page.url()).searchParams.has("scrollTo")).toBe(false);

    await page.waitForTimeout(SCROLL_DEBOUNCE_WAIT_MS);
    await expect(page).toHaveURL(/scrollTo=/);

    const scrollTo = new URL(page.url()).searchParams.get("scrollTo");
    expect(scrollTo).toBeTruthy();
    expect(new Date(scrollTo as string).toString()).not.toBe("Invalid Date");
    // Rounded to 5-minute granularity.
    expect(new Date(scrollTo as string).getMinutes() % 5).toBe(0);

    // History replace, not push: writing scrollTo must not grow the
    // history stack, even across multiple debounced writes.
    await scrollContainer.evaluate((el) => {
      el.scrollLeft = el.scrollLeft + 200;
    });
    await page.waitForTimeout(SCROLL_DEBOUNCE_WAIT_MS);

    const historyLengthAfterScroll = await page.evaluate(
      () => window.history.length,
    );
    expect(historyLengthAfterScroll).toBe(historyLengthBeforeScroll);
  });

  test("opening a URL with scrollTo centers the viewport on that moment", async ({
    page,
  }) => {
    const scrollContainer = await openTimeline(page);

    // Scroll to discover a real, in-range moment to jump back to.
    await scrollContainer.evaluate((el) => {
      el.scrollLeft = el.scrollLeft + 600;
    });
    await page.waitForTimeout(SCROLL_DEBOUNCE_WAIT_MS);

    const scrollTo = new URL(page.url()).searchParams.get("scrollTo");
    expect(scrollTo).toBeTruthy();
    const scrollLeftAfterScroll = await scrollContainer.evaluate(
      (el) => el.scrollLeft,
    );

    // Reset by navigating away, then open the URL with scrollTo directly.
    await page.goto(
      `${TIMELINE_PATH}?scrollTo=${encodeURIComponent(scrollTo as string)}`,
    );
    const reloadedContainer = page.getByTestId("timeline-scroll-container");
    await expect(reloadedContainer).toBeVisible();

    const scrollLeftOnLoad = await reloadedContainer.evaluate(
      (el) => el.scrollLeft,
    );

    // Centering is deterministic given the same viewport width, so this
    // should land close to where the debounced write captured it from.
    expect(Math.abs(scrollLeftOnLoad - scrollLeftAfterScroll)).toBeLessThan(10);
  });

  test("a full reload restores the viewport position from scrollTo", async ({
    page,
  }) => {
    const scrollContainer = await openTimeline(page);

    await scrollContainer.evaluate((el) => {
      el.scrollLeft = el.scrollLeft + 500;
    });
    await page.waitForTimeout(SCROLL_DEBOUNCE_WAIT_MS);

    const urlWithScroll = page.url();
    expect(new URL(urlWithScroll).searchParams.has("scrollTo")).toBe(true);
    const scrollLeftBeforeReload = await scrollContainer.evaluate(
      (el) => el.scrollLeft,
    );

    // Reloading the same URL restores the viewport via mount-time centering
    // on the scrollTo param.
    await page.goto(urlWithScroll);
    const reloadedContainer = page.getByTestId("timeline-scroll-container");
    await expect(reloadedContainer).toBeVisible();
    await expect
      .poll(async () =>
        Math.abs(
          (await reloadedContainer.evaluate((el) => el.scrollLeft)) -
            scrollLeftBeforeReload,
        ),
      )
      .toBeLessThan(10);
  });
});
