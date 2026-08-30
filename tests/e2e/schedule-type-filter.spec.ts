import { test, expect, Page } from "@playwright/test";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025".
// "Morning Yoga Workshop" is the edition's only workshop-typed set;
// "Mystery Closing Ritual" is untyped (NULL) and must surface under "Other";
// the seeded music sets (e.g. Maya Jane Coles) are untyped as well.
const TIMELINE_PATH = "/festivals/test/editions/2025/schedule/timeline";
const LIST_PATH = "/festivals/test/editions/2025/schedule/list";

const WORKSHOP_SET_NAME = "Morning Yoga Workshop";
const UNTYPED_SET_NAME = "Mystery Closing Ritual";
const MUSIC_SET_NAME = "Maya Jane Coles";

const WORKSHOP_TYPES_PARAM = `types=${encodeURIComponent(JSON.stringify(["workshop"]))}`;

test.describe("Schedule set-type filter", { tag: "@smoke" }, () => {
  test("filtering the list view to workshops leaves only workshop sets", async ({
    page,
  }) => {
    await page.goto(LIST_PATH);
    await expect(listSchedule(page)).toBeVisible();
    await expect(page.getByText(MUSIC_SET_NAME).first()).toBeVisible();

    await firstDayHeader(page).getByTestId("schedule-filters-trigger").click();
    const sheet = page.getByTestId("schedule-filter-sheet");
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: "Workshop" }).click();
    await sheet.getByText("Done").click();

    // TanStack Router JSON-serializes array search params: types=["workshop"]
    await expect(page).toHaveURL(/types=%5B%22workshop%22%5D/);
    await expect(page.getByText(WORKSHOP_SET_NAME)).toBeVisible();
    await expect(page.getByText(MUSIC_SET_NAME)).toHaveCount(0);
    await expect(page.getByTestId("schedule-filters-badge").first()).toHaveText(
      "1",
    );
  });

  test("a shared ?types= link filters the timeline view too", async ({
    page,
  }) => {
    await page.goto(`${TIMELINE_PATH}?${WORKSHOP_TYPES_PARAM}`);
    await expect(page.getByTestId("timeline-scroll-container")).toBeVisible();

    await expect(page.getByText(WORKSHOP_SET_NAME).first()).toBeVisible();
    await expect(page.getByText(MUSIC_SET_NAME)).toHaveCount(0);
    await expect(page.getByTestId("schedule-filters-badge")).toHaveText("1");
  });

  test("untyped sets surface under the Other chip", async ({ page }) => {
    await page.goto(
      `${LIST_PATH}?types=${encodeURIComponent(JSON.stringify(["other"]))}`,
    );
    await expect(listSchedule(page)).toBeVisible();

    await expect(page.getByText(UNTYPED_SET_NAME)).toBeVisible();
    await expect(page.getByText(WORKSHOP_SET_NAME)).toHaveCount(0);
  });
});

function listSchedule(page: Page) {
  return page.getByRole("region", { name: "Schedule by day" });
}

// Every sticky day header carries its own copy of the filter controls, so
// list-view assertions have to name a single day group.
function firstDayHeader(page: Page) {
  return listSchedule(page).getByRole("region").first();
}
