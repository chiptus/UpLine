import { test, expect } from "@playwright/test";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025".
const LIST_PATH = "/festivals/test/editions/2025/schedule/list";

test.describe("Schedule chrome", () => {
  test("mobile bottom tab bar hides on scroll down and returns on scroll up", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(LIST_PATH);

    const listSchedule = page.getByTestId("list-schedule");
    if (!(await listSchedule.isVisible().catch(() => false))) {
      test.skip(true, "Schedule not revealed in this environment");
    }

    const tabBar = page.getByTestId("mobile-tab-bar");
    await expect(tabBar).toBeVisible();
    await expect(tabBar).not.toHaveClass(/translate-y-full/);

    await page.mouse.wheel(0, 600);
    await expect(tabBar).toHaveClass(/translate-y-full/);

    await page.mouse.wheel(0, -600);
    await expect(tabBar).not.toHaveClass(/translate-y-full/);
  });

  test("list view's day header stays stuck for the whole day and hosts the filters trigger", async ({
    page,
  }) => {
    await page.goto(LIST_PATH);

    const listSchedule = page.getByTestId("list-schedule");
    if (!(await listSchedule.isVisible().catch(() => false))) {
      test.skip(true, "Schedule not revealed in this environment");
    }

    const dayGroups = page.getByTestId("list-day-group");
    const groupCount = await dayGroups.count();
    if (groupCount === 0) {
      test.skip(true, "No sets in this environment");
    }

    const firstGroup = dayGroups.first();
    const firstHeader = firstGroup.locator("h2").first();
    const trigger = firstGroup.getByTestId("schedule-filters-trigger");
    await expect(trigger).toBeVisible();

    await trigger.click();
    await expect(page.getByTestId("schedule-filter-sheet")).toBeVisible();
    await page.getByTestId("schedule-filter-sheet").getByText("Done").click();

    // A stuck header holds a fixed `top` while its section scrolls past
    // behind it — verify that top is the same after two different amounts
    // of scroll, and that it's still the first day's header on screen
    // (rather than merely still being somewhere in the viewport).
    await page.mouse.wheel(0, 300);
    await expect(firstHeader).toBeVisible();
    const topAfterFirstScroll = await firstHeader.evaluate(
      (el) => el.getBoundingClientRect().top,
    );

    await page.mouse.wheel(0, 300);
    await expect(firstHeader).toBeVisible();
    const topAfterSecondScroll = await firstHeader.evaluate(
      (el) => el.getBoundingClientRect().top,
    );

    expect(topAfterSecondScroll).toBeCloseTo(topAfterFirstScroll, 0);
  });
});
