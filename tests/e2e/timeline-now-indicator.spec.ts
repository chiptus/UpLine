import { test, expect } from "@playwright/test";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025",
// three festival days (Jul 12-14, 2025). Sets span from Fri Jul 12 16:00 UTC
// (earliest set start) through Sun Jul 14 23:00 UTC (latest set end) - the
// rendered timeline's festival window.
const TIMELINE_PATH = "/festivals/test/editions/2025/schedule/timeline";

// Comfortably inside the seeded festival window.
const NOW_INSIDE_WINDOW = new Date("2025-07-13T12:00:00Z");
// Two days before the earliest seeded set.
const NOW_BEFORE_WINDOW = new Date("2025-07-10T12:00:00Z");
// Two days after the latest seeded set ends.
const NOW_AFTER_WINDOW = new Date("2025-07-16T12:00:00Z");

test.describe("Timeline Now pill and current-time indicator", () => {
  test("render when now falls inside the festival window", async ({ page }) => {
    await page.clock.setFixedTime(NOW_INSIDE_WINDOW);
    await page.goto(TIMELINE_PATH);

    const nowButton = page.getByTestId("now-jump-button");
    await expect(nowButton).toBeVisible();

    const indicator = page.getByTestId("timeline-now-indicator");
    await expect(indicator).toBeVisible();

    const left = await indicator.evaluate((el) =>
      parseFloat((el as HTMLElement).style.left),
    );
    expect(left).toBeGreaterThan(0);
    expect(Number.isFinite(left)).toBe(true);
  });

  test("are absent when now is before the festival window", async ({
    page,
  }) => {
    await page.clock.setFixedTime(NOW_BEFORE_WINDOW);
    await page.goto(TIMELINE_PATH);

    await expect(page.getByTestId("now-jump-button")).toHaveCount(0);
    await expect(page.getByTestId("timeline-now-indicator")).toHaveCount(0);
  });

  test("are absent when now is after the festival window", async ({ page }) => {
    await page.clock.setFixedTime(NOW_AFTER_WINDOW);
    await page.goto(TIMELINE_PATH);

    await expect(page.getByTestId("now-jump-button")).toHaveCount(0);
    await expect(page.getByTestId("timeline-now-indicator")).toHaveCount(0);
  });

  test("tapping Now writes scrollTo and smooth-scrolls to the current time", async ({
    page,
  }) => {
    await page.clock.setFixedTime(NOW_INSIDE_WINDOW);
    await page.goto(TIMELINE_PATH);

    const scrollContainer = page.getByTestId("timeline-scroll-container");

    const nowButton = page.getByTestId("now-jump-button");
    await expect(nowButton).toBeVisible();

    // Scroll away first so the jump is observable.
    await scrollContainer.evaluate((el) => {
      el.scrollLeft = 0;
    });

    await nowButton.click();

    await expect(page).toHaveURL(/scrollTo=/);
    const scrollTo = new URL(page.url()).searchParams.get("scrollTo");
    expect(scrollTo).toBeTruthy();

    const scrollToDate = new Date(scrollTo as string);
    expect(scrollToDate.toString()).not.toBe("Invalid Date");
    // Rounded to 5-minute granularity, so allow a small window either side
    // of the fixed "now".
    expect(
      Math.abs(scrollToDate.getTime() - NOW_INSIDE_WINDOW.getTime()),
    ).toBeLessThan(5 * 60 * 1000);

    const scrollLeftAfterJump = await scrollContainer.evaluate(
      (el) => el.scrollLeft,
    );
    expect(scrollLeftAfterJump).toBeGreaterThan(0);
  });
});
