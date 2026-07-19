import { test, expect } from "@playwright/test";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025",
// three festival days (Jul 12-14, 2025) each with timed sets.
const TIMELINE_PATH = "/festivals/test/editions/2025/schedule/timeline";
const SCROLL_ANIMATION_WAIT_MS = 800; // > smooth-scroll animation + the ~300ms debounce

test.describe("Timeline day-jump toolbar", () => {
  test("renders one sticky button per festival day, labeled weekday + date", async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    const scrollContainer = page.getByTestId("timeline-scroll-container");
    await expect(scrollContainer).toBeVisible({ timeout: 15000 });

    const toolbar = page.getByRole("toolbar", { name: "Jump to day" });
    await expect(toolbar).toBeVisible();

    const dayButtons = toolbar.getByRole("button");
    const count = await dayButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < count; i++) {
      const label = (await dayButtons.nth(i).textContent())?.trim() ?? "";
      // e.g. "Sat 12" - abbreviated weekday, then day-of-month.
      expect(label).toMatch(/^[A-Za-z]{3} \d{1,2}$/);
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

    const dayButtons = page.getByRole("toolbar", { name: "Jump to day" }).getByRole("button");
    // Jump to the last day, which should be far from the initial viewport.
    await dayButtons.last().click();

    await page.waitForTimeout(SCROLL_ANIMATION_WAIT_MS);

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
      .getByRole("toolbar", { name: "Jump to day" })
      .getByRole("button");
    // Move away first so the jump back is observable.
    await dayButtons.last().click();
    await page.waitForTimeout(SCROLL_ANIMATION_WAIT_MS);

    await dayButtons.first().click();
    await page.waitForTimeout(SCROLL_ANIMATION_WAIT_MS);

    const scrollTo = new URL(page.url()).searchParams.get("scrollTo");
    expect(scrollTo).toBeTruthy();

    await page.waitForTimeout(SCROLL_ANIMATION_WAIT_MS);
    expect(new URL(page.url()).searchParams.get("scrollTo")).toBe(scrollTo);
  });

  test("with a day filter active, only that day's button renders", async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    const scrollContainer = page.getByTestId("timeline-scroll-container");
    await expect(scrollContainer).toBeVisible({ timeout: 15000 });

    const toolbar = page.getByRole("toolbar", { name: "Jump to day" });
    const allDaysButtons = toolbar.getByRole("button");
    const totalDays = await allDaysButtons.count();
    expect(totalDays).toBeGreaterThanOrEqual(2);

    const firstDayLabel = (await allDaysButtons.first().textContent())?.trim();

    await page.goto(`${TIMELINE_PATH}?day=2025-07-12`);
    const filteredToolbar = page.getByRole("toolbar", { name: "Jump to day" });
    await expect(filteredToolbar).toBeVisible();

    const filteredButtons = filteredToolbar.getByRole("button");
    await expect(filteredButtons).toHaveCount(1);
    expect((await filteredButtons.first().textContent())?.trim()).toBe(
      firstDayLabel,
    );
  });
});
