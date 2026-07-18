import { test, expect, type Page } from "@playwright/test";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025".
const TIMELINE_PATH = "/festivals/test/editions/2025/schedule/timeline";
// Fast-forwarded past the ~300ms debounce via Playwright's fake clock.
const SCROLL_DEBOUNCE_WAIT_MS = 600;

async function openTimeline(page: Page) {
  await page.clock.install();
  await page.goto(TIMELINE_PATH);

  const scrollContainer = page.getByTestId("timeline-scroll-container");
  if (!(await scrollContainer.isVisible().catch(() => false))) {
    test.skip(true, "Schedule not revealed in this environment");
  }

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
    await page.clock.fastForward(100);
    expect(new URL(page.url()).searchParams.has("scrollTo")).toBe(false);

    await page.clock.fastForward(SCROLL_DEBOUNCE_WAIT_MS);
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
    await page.clock.fastForward(SCROLL_DEBOUNCE_WAIT_MS);

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
    await page.clock.fastForward(SCROLL_DEBOUNCE_WAIT_MS);

    const scrollTo = new URL(page.url()).searchParams.get("scrollTo");
    expect(scrollTo).toBeTruthy();
    const scrollLeftAfterScroll = await scrollContainer.evaluate(
      (el) => el.scrollLeft,
    );

    // Reset by navigating away, then open the URL with scrollTo directly.
    await page.goto(`${TIMELINE_PATH}?scrollTo=${encodeURIComponent(scrollTo as string)}`);
    const reloadedContainer = page.getByTestId("timeline-scroll-container");
    await expect(reloadedContainer).toBeVisible();

    const scrollLeftOnLoad = await reloadedContainer.evaluate(
      (el) => el.scrollLeft,
    );

    // Centering is deterministic given the same viewport width, so this
    // should land close to where the debounced write captured it from.
    expect(Math.abs(scrollLeftOnLoad - scrollLeftAfterScroll)).toBeLessThan(
      10,
    );
  });

  test("back from a set detail page and a full reload both restore the viewport position", async ({
    page,
  }) => {
    const scrollContainer = await openTimeline(page);

    await scrollContainer.evaluate((el) => {
      el.scrollLeft = el.scrollLeft + 500;
    });
    await page.clock.fastForward(SCROLL_DEBOUNCE_WAIT_MS);

    const urlWithScroll = page.url();
    const scrollLeftBeforeNav = await scrollContainer.evaluate(
      (el) => el.scrollLeft,
    );

    const setLink = page.locator('a[href*="/sets/"]').first();
    await expect(setLink).toBeVisible();
    await setLink.click();
    await page.goBack();
    await expect(page).toHaveURL(urlWithScroll);

    const restoredContainer = page.getByTestId("timeline-scroll-container");
    await expect(restoredContainer).toBeVisible();
    const scrollLeftAfterBack = await restoredContainer.evaluate(
      (el) => el.scrollLeft,
    );
    expect(Math.abs(scrollLeftAfterBack - scrollLeftBeforeNav)).toBeLessThan(
      10,
    );

    // A full reload of the same URL should independently restore the
    // viewport position via mount-time centering on scrollTo.
    await page.goto(urlWithScroll);
    const reloadedContainer = page.getByTestId("timeline-scroll-container");
    await expect(reloadedContainer).toBeVisible();
    const scrollLeftAfterReload = await reloadedContainer.evaluate(
      (el) => el.scrollLeft,
    );
    expect(Math.abs(scrollLeftAfterReload - scrollLeftBeforeNav)).toBeLessThan(
      10,
    );
  });
});
