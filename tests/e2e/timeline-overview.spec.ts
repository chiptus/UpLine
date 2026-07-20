import { test, expect } from "@playwright/test";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025",
// three festival days (Jul 12-14, 2025) each with timed sets.
const TIMELINE_PATH = "/festivals/test/editions/2025/schedule/timeline";
const SCROLL_ANIMATION_WAIT_MS = 800; // > smooth-scroll animation + the ~300ms debounce
const DEBOUNCE_WAIT_MS = 600; // > the ~300ms debounce in useTimelineScrollSync

test.describe("Timeline overview mini-map", () => {
  test("collapsed by default; toggle expands and collapses it", async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    const scrollContainer = page.getByTestId("timeline-scroll-container");
    await expect(scrollContainer).toBeVisible({ timeout: 15000 });

    const overview = page.getByTestId("timeline-overview");
    await expect(overview).not.toBeVisible();

    const toggle = page.getByTestId("timeline-overview-toggle");
    await expect(toggle).toHaveText("Show overview");

    await toggle.click();
    await expect(overview).toBeVisible();
    await expect(toggle).toHaveText("Hide overview");

    await toggle.click();
    await expect(overview).not.toBeVisible();
    await expect(toggle).toHaveText("Show overview");
  });

  test("clicking the map jumps the strip and writes scrollTo", async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    const scrollContainer = page.getByTestId("timeline-scroll-container");
    await expect(scrollContainer).toBeVisible({ timeout: 15000 });

    await page.getByTestId("timeline-overview-toggle").click();
    const map = page.getByTestId("timeline-overview-map");
    await expect(map).toBeVisible();

    const scrollLeftBeforeJump = await scrollContainer.evaluate(
      (el) => el.scrollLeft,
    );

    const mapBox = await map.boundingBox();
    if (!mapBox) throw new Error("overview map has no bounding box");

    // Click near the right edge of the map, far from wherever the strip
    // is currently centered.
    await page.mouse.click(mapBox.x + mapBox.width * 0.9, mapBox.y + mapBox.height / 2);

    await page.waitForTimeout(SCROLL_ANIMATION_WAIT_MS);

    await expect(page).toHaveURL(/scrollTo=/);
    const scrollTo = new URL(page.url()).searchParams.get("scrollTo");
    expect(scrollTo).toBeTruthy();
    expect(new Date(scrollTo as string).toString()).not.toBe("Invalid Date");

    const scrollLeftAfterJump = await scrollContainer.evaluate(
      (el) => el.scrollLeft,
    );
    expect(scrollLeftAfterJump).not.toBe(scrollLeftBeforeJump);
  });

  test("dragging the viewport window scrubs the strip and settles into scrollTo", async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    const scrollContainer = page.getByTestId("timeline-scroll-container");
    await expect(scrollContainer).toBeVisible({ timeout: 15000 });

    await page.getByTestId("timeline-overview-toggle").click();
    const viewportWindow = page.getByTestId("timeline-overview-viewport");
    await expect(viewportWindow).toBeVisible();

    const scrollLeftBeforeDrag = await scrollContainer.evaluate(
      (el) => el.scrollLeft,
    );

    const handleBox = await viewportWindow.boundingBox();
    if (!handleBox) throw new Error("viewport window has no bounding box");

    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 150, startY, { steps: 10 });

    // The strip should already have moved mid-drag: dragging writes
    // scrollLeft directly, not through the debounced/smooth jumpTo path.
    const scrollLeftMidDrag = await scrollContainer.evaluate(
      (el) => el.scrollLeft,
    );
    expect(scrollLeftMidDrag).not.toBe(scrollLeftBeforeDrag);

    await page.mouse.up();

    await page.waitForTimeout(DEBOUNCE_WAIT_MS);
    await expect(page).toHaveURL(/scrollTo=/);
    const scrollTo = new URL(page.url()).searchParams.get("scrollTo");
    expect(scrollTo).toBeTruthy();
    expect(new Date(scrollTo as string).toString()).not.toBe("Invalid Date");
  });

  test("with a day filter active, the map reflects only that day", async ({
    page,
  }) => {
    await page.goto(`${TIMELINE_PATH}?day=2025-07-12`);

    const scrollContainer = page.getByTestId("timeline-scroll-container");
    await expect(scrollContainer).toBeVisible({ timeout: 15000 });

    await page.getByTestId("timeline-overview-toggle").click();
    await expect(page.getByTestId("timeline-overview")).toBeVisible();

    const stageRows = page.getByTestId("timeline-overview-stage-row");
    expect(await stageRows.count()).toBeGreaterThan(0);
  });
});
