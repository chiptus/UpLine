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

    const dayGroups = page.getByTestId("list-day-group");
    const groupCount = await dayGroups.count();
    if (groupCount < 2) {
      test.skip(true, "Needs at least two festival days of sets seeded");
    }

    const firstHeader = dayGroups.nth(0).getByTestId("list-day-header");
    const firstHeaderText = await firstHeader.innerText();
    const topBefore = await firstHeader.evaluate(
      (el) => el.getBoundingClientRect().top,
    );

    // Scroll partway through the first day's section: the header must
    // remain stuck at the same docked offset the whole way, not just for
    // the first screen.
    await page.mouse.wheel(0, 600);
    await expect
      .poll(async () =>
        firstHeader.evaluate((el) => el.getBoundingClientRect().top),
      )
      .toBe(topBefore);
    await expect(firstHeader).toHaveText(firstHeaderText);

    // Scroll to the very end of the first day's section: the next day's
    // header takes over, docked at the same offset.
    const firstGroupBox = await dayGroups.nth(0).boundingBox();
    expect(firstGroupBox).not.toBeNull();
    await page.mouse.wheel(0, (firstGroupBox?.height ?? 0) + 800);

    const secondHeader = dayGroups.nth(1).getByTestId("list-day-header");
    await expect(secondHeader).toBeVisible();
    const secondHeaderText = await secondHeader.innerText();
    expect(secondHeaderText).not.toBe(firstHeaderText);

    const topAfter = await secondHeader.evaluate(
      (el) => el.getBoundingClientRect().top,
    );
    expect(topAfter).toBe(topBefore);
  });

  test("opens the filter sheet from the sticky day header", async ({
    page,
  }) => {
    await page.goto(LIST_PATH);

    const listSchedule = page.getByTestId("list-schedule");
    if (!(await listSchedule.isVisible().catch(() => false))) {
      test.skip(true, "Schedule not revealed in this environment");
    }

    const dayHeader = page.getByTestId("list-day-header").first();
    const trigger = dayHeader.getByTestId("schedule-filters-trigger");
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAccessibleName(/Filters/);

    await trigger.click();
    await expect(page.getByTestId("schedule-filter-sheet")).toBeVisible();
  });
});
