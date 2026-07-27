import { test, expect } from "@playwright/test";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025",
// three festival days (Jul 12-14, 2025), stages "Main Stage" and "Club Stage".
const LIST_PATH = "/festivals/test/editions/2025/schedule/list";

test.describe("List view sticky day header", () => {
  test("stays stuck across a full day's sets and hands over to the next day", async ({
    page,
  }) => {
    await page.goto(LIST_PATH);

    // Each festival day renders as an accessible region, labeled by its day
    // name, with a heading hosting the sticky header content. Seeded across
    // three festival days (Jul 12-14), so at least two are always present.
    const dayGroups = page.getByRole("region");
    await expect(dayGroups).toHaveCount(3);

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

    const dayGroup = page.getByRole("region").first();
    const trigger = dayGroup.getByRole("button", { name: /Filters/ });
    await expect(trigger).toBeVisible();

    await trigger.click();
    await expect(page.getByTestId("schedule-filter-sheet")).toBeVisible();
  });
});
