import { test, expect } from "@playwright/test";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025",
// three festival days (Jul 12-14, 2025), stages "Main Stage" and "Club Stage".
const LIST_PATH = "/festivals/test/editions/2025/schedule/list";

test.describe("List view sticky day header", () => {
  test("stays stuck across a full day's sets and hands over to the next day", async ({
    page,
  }) => {
    await page.goto(LIST_PATH);

    const listSchedule = page.getByTestId("list-schedule");
    if (!(await listSchedule.isVisible().catch(() => false))) {
      test.skip(true, "Schedule not revealed in this environment");
    }

    // Each festival day renders as an accessible region, labeled by its day
    // name, with a heading hosting the sticky header content.
    const dayGroups = page.getByRole("region");
    const groupCount = await dayGroups.count();
    if (groupCount < 2) {
      test.skip(true, "Needs at least two festival days of sets seeded");
    }

    const firstHeading = dayGroups.nth(0).getByRole("heading", { level: 2 });
    const firstHeadingText = await firstHeading.innerText();
    const topBefore = await firstHeading.evaluate(
      (el) => el.getBoundingClientRect().top,
    );

    // Scroll partway through the first day's section: the header must
    // remain stuck at the same docked offset the whole way, not just for
    // the first screen. Sub-pixel rounding can shift getBoundingClientRect
    // by <1px across scroll events, so allow a small tolerance.
    await page.mouse.wheel(0, 600);
    await expect
      .poll(async () =>
        firstHeading.evaluate((el) => el.getBoundingClientRect().top),
      )
      .toBeCloseTo(topBefore, 0);
    await expect(firstHeading).toHaveText(firstHeadingText);

    // Scroll to the very end of the first day's section: the next day's
    // header takes over, docked at the same offset.
    const firstGroupBox = await dayGroups.nth(0).boundingBox();
    expect(firstGroupBox).not.toBeNull();
    await page.mouse.wheel(0, (firstGroupBox?.height ?? 0) + 800);

    const secondHeading = dayGroups.nth(1).getByRole("heading", { level: 2 });
    await expect(secondHeading).toBeVisible();
    const secondHeadingText = await secondHeading.innerText();
    expect(secondHeadingText).not.toBe(firstHeadingText);

    const topAfter = await secondHeading.evaluate(
      (el) => el.getBoundingClientRect().top,
    );
    expect(topAfter).toBeCloseTo(topBefore, 0);
  });

  test("opens the filter sheet from the sticky day header", async ({
    page,
  }) => {
    await page.goto(LIST_PATH);

    const listSchedule = page.getByTestId("list-schedule");
    if (!(await listSchedule.isVisible().catch(() => false))) {
      test.skip(true, "Schedule not revealed in this environment");
    }

    const dayGroup = page.getByRole("region").first();
    const trigger = dayGroup.getByTestId("schedule-filters-trigger");
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAccessibleName(/Filters/);

    await trigger.click();
    await expect(page.getByTestId("schedule-filter-sheet")).toBeVisible();
  });
});
