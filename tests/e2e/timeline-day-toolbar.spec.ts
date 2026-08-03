import { test, expect } from "@playwright/test";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025",
// three festival days (Jul 12-14, 2025) each with timed sets.
const TIMELINE_PATH = "/festivals/test/editions/2025/schedule/timeline";
const SCROLL_ANIMATION_WAIT_MS = 800; // > smooth-scroll animation + the ~300ms debounce

test.describe("Timeline day-jump toolbar", { tag: "@smoke" }, () => {
  test("renders one sticky button per festival day, labeled weekday + date", async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    const scrollContainer = page.getByTestId("timeline-scroll-container");
    await expect(scrollContainer).toBeVisible({ timeout: 15000 });

    const toolbar = page.getByRole("radiogroup", { name: "Jump to day" });
    await expect(toolbar).toBeVisible();

    const dayButtons = toolbar.getByRole("radio");
    const count = await dayButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < count; i++) {
      const label = (await dayButtons.nth(i).textContent())?.trim() ?? "";
      // Weekday over day-of-month, rendered as two stacked block spans, so
      // textContent concatenates with no separator, e.g. "Sat12".
      expect(label).toMatch(/^[A-Za-z]{3}\s*\d{1,2}$/);
    }
  });

  test("tapping a day button writes scrollTo and smooth-scrolls the strip", async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    const scrollContainer = page.getByTestId("timeline-scroll-container");
    await expect(scrollContainer).toBeVisible({ timeout: 15000 });

    expect(new URL(page.url()).searchParams.has("scrollTo")).toBe(false);

    const scrollLeftBeforeJump = await scrollContainer.evaluate(
      (el) => el.scrollLeft,
    );

    const dayButtons = page
      .getByRole("radiogroup", { name: "Jump to day" })
      .getByRole("radio");
    // Jump to the last day, which should be far from the initial viewport.
    await dayButtons.last().click();

    await expect(page).toHaveURL(/scrollTo=/);
    const scrollTo = new URL(page.url()).searchParams.get("scrollTo");
    expect(scrollTo).toBeTruthy();
    expect(new Date(scrollTo as string).toString()).not.toBe("Invalid Date");

    const scrollLeftAfterJump = await scrollContainer.evaluate(
      (el) => el.scrollLeft,
    );
    expect(scrollLeftAfterJump).not.toBe(scrollLeftBeforeJump);

    // The write must be stable: the post-scroll debounced write settles on
    // the same moment jumpTo wrote, so the URL doesn't drift afterwards.
    await page.waitForTimeout(SCROLL_ANIMATION_WAIT_MS);
    expect(new URL(page.url()).searchParams.get("scrollTo")).toBe(scrollTo);
  });

  test("jumping to the first day clamps to the strip start without URL drift", async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    const scrollContainer = page.getByTestId("timeline-scroll-container");
    await expect(scrollContainer).toBeVisible({ timeout: 15000 });

    const dayButtons = page
      .getByRole("radiogroup", { name: "Jump to day" })
      .getByRole("radio");
    // Move away first so the jump back is observable.
    await dayButtons.last().click();
    await expect(page).toHaveURL(/scrollTo=/);
    const afterLastJump = new URL(page.url()).searchParams.get("scrollTo");

    // The jump back to the first day is the longest smooth-scroll on the
    // strip; wait for the debounced write to settle on a new moment rather
    // than guessing a fixed animation duration.
    await dayButtons.first().click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("scrollTo"))
      .not.toBe(afterLastJump);

    const scrollTo = new URL(page.url()).searchParams.get("scrollTo");
    expect(scrollTo).toBeTruthy();

    // The write must be stable: no drift once the scroll has settled.
    await page.waitForTimeout(SCROLL_ANIMATION_WAIT_MS);
    expect(new URL(page.url()).searchParams.get("scrollTo")).toBe(scrollTo);
  });

  test("with a day filter active, only that day's button renders", async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    const scrollContainer = page.getByTestId("timeline-scroll-container");
    await expect(scrollContainer).toBeVisible({ timeout: 15000 });

    const toolbar = page.getByRole("radiogroup", { name: "Jump to day" });
    const allDaysButtons = toolbar.getByRole("radio");
    const totalDays = await allDaysButtons.count();
    expect(totalDays).toBeGreaterThanOrEqual(2);

    const firstDayLabel = (await allDaysButtons.first().textContent())?.trim();

    await page.goto(`${TIMELINE_PATH}?day=2025-07-12`);
    const filteredToolbar = page.getByRole("radiogroup", {
      name: "Jump to day",
    });
    await expect(filteredToolbar).toBeVisible();

    const filteredButtons = filteredToolbar.getByRole("radio");
    await expect(filteredButtons).toHaveCount(1);
    expect((await filteredButtons.first().textContent())?.trim()).toBe(
      firstDayLabel,
    );
  });
});
