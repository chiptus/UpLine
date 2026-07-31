import { test, expect } from "@playwright/test";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025",
// three festival days (Jul 12-14, 2025), stages "Main Stage" and "Club Stage".
const TIMELINE_PATH = "/festivals/test/editions/2025/schedule/timeline";
const LIST_PATH = "/festivals/test/editions/2025/schedule/list";
const MAIN_STAGE_ID = "11111111-1111-1111-1111-11111111111a";

async function openSheet(
  page: import("@playwright/test").Page,
  trigger: import("@playwright/test").Locator,
) {
  await trigger.click();
  await expect(page.getByTestId("schedule-filter-sheet")).toBeVisible();
}

test.describe("Schedule filter sheet", () => {
  test("opens from the Timeline toolbar with title and description", async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    // The Filters trigger sits inline in the toolbar row, alongside the
    // day-jump buttons - never alone on its own line.
    const toolbar = page.getByTestId("timeline-day-toolbar");
    const trigger = toolbar.getByTestId("schedule-filters-trigger");
    await expect(trigger).toBeVisible();

    await trigger.click();

    const sheet = page.getByTestId("schedule-filter-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("Filter schedule")).toBeVisible();
    await expect(
      sheet.getByText("Narrow the schedule by day, time of day, and stage."),
    ).toBeVisible();
  });

  test("opens from the List view's sticky day header into the same sheet", async ({
    page,
  }) => {
    await page.goto(LIST_PATH);

    const dayGroup = page.getByRole("region", { name: /Jul 12/ });
    const trigger = dayGroup.getByRole("button", { name: /Filters/ });
    await expect(trigger).toBeVisible();

    await openSheet(page, trigger);
    await expect(
      page.getByTestId("schedule-filter-sheet").getByText("Filter schedule"),
    ).toBeVisible();
  });

  test("selecting a day filter updates the badge, both views, and never scrolls the Timeline", async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    const scrollContainer = page.getByTestId("timeline-scroll-container");

    await expect(page.getByTestId("schedule-filters-badge")).toHaveCount(0);

    const scrollLeftBefore = await scrollContainer.evaluate(
      (el) => el.scrollLeft,
    );

    await openSheet(page, page.getByRole("button", { name: /Filters/ }));
    await page.getByTestId("day-filter-trigger").click();
    await page.getByRole("option", { name: /^Saturday$/ }).click();
    await page.getByTestId("schedule-filter-sheet").getByText("Done").click();

    await expect(page).toHaveURL(/day=2025-07-12/);
    await expect(page.getByTestId("schedule-filters-badge")).toHaveText("1");

    // Day filter collapses the Timeline strip to a single day, but applying
    // it must never scroll the viewport.
    const toolbar = page.getByTestId("timeline-day-toolbar");
    await expect(
      toolbar
        .getByRole("radiogroup", { name: "Jump to day" })
        .getByRole("radio"),
    ).toHaveCount(1);

    // Collapsing to one day can shrink total content below the viewport
    // width, which forces the browser to clamp scrollLeft to 0 regardless of
    // app behavior — so compare against the post-filter clamp ceiling rather
    // than asserting raw equality.
    const { scrollLeftAfter, maxScrollLeftAfter } =
      await scrollContainer.evaluate((el) => ({
        scrollLeftAfter: el.scrollLeft,
        maxScrollLeftAfter: el.scrollWidth - el.clientWidth,
      }));
    expect(scrollLeftAfter).toBe(
      Math.min(scrollLeftBefore, maxScrollLeftAfter),
    );

    // Shared URL state: the List view sees and can clear the same filter.
    await page.goto(`${LIST_PATH}?day=2025-07-12`);
    await expect(page.getByTestId("schedule-filters-badge")).toHaveText("1");
  });

  test("clearing filters from the sheet restores both views and removes the badge", async ({
    page,
  }) => {
    await page.goto(
      `${TIMELINE_PATH}?day=2025-07-12&stages=${encodeURIComponent(JSON.stringify([MAIN_STAGE_ID]))}`,
    );

    await expect(page.getByTestId("schedule-filters-badge")).toHaveText("2");

    await openSheet(page, page.getByRole("button", { name: /Filters/ }));
    await page.getByTestId("schedule-filters-clear").click();

    await expect(page.getByTestId("schedule-filters-badge")).toHaveCount(0);
    await expect(page).not.toHaveURL(/day=/);
    await expect(page).not.toHaveURL(/stages=/);

    await page.goto(LIST_PATH);
    await expect(page.getByTestId("schedule-filters-badge")).toHaveCount(0);
  });
});
