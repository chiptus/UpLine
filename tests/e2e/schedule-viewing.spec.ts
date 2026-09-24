import { test, expect, Page } from "@playwright/test";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025",
// three festival days (Jul 12-14, 2025), stages "Main Stage" and "Club
// Stage". "Maya Jane Coles" (slug maya-jane-coles-set) is one of the
// edition's seeded sets, used here as a fixed schedule entry to click through.
const TIMELINE_PATH = "/festivals/test/editions/2025/schedule/timeline";
const LIST_PATH = "/festivals/test/editions/2025/schedule/list";
const DAY_PARAM = "day=2025-07-12";
const SET_NAME = "Maya Jane Coles";
const SET_DETAIL_PATH =
  "/festivals/test/editions/2025/sets/maya-jane-coles-set";

test.describe("Schedule view switching", { tag: "@smoke" }, () => {
  test("switching Timeline to List and back preserves the selected day", async ({
    page,
  }) => {
    await page.goto(`${TIMELINE_PATH}?${DAY_PARAM}`);
    await expect(page.getByTestId("timeline-scroll-container")).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("link", { name: "List" }).click();

    await expect(page).toHaveURL(new RegExp(DAY_PARAM));
    const dayGroups = page
      .getByRole("region", { name: "Schedule by day" })
      .getByRole("region");
    await expect(dayGroups).toHaveCount(1);

    await page.getByRole("link", { name: "Timeline" }).click();

    await expect(page).toHaveURL(new RegExp(DAY_PARAM));
    await expect(page.getByTestId("timeline-scroll-container")).toBeVisible();
    const dayButtons = page
      .getByRole("radiogroup", { name: "Jump to day" })
      .getByRole("radio");
    await expect(dayButtons).toHaveCount(1);
  });
});

test.describe(
  "Schedule entry to set detail navigation",
  { tag: "@smoke" },
  () => {
    test("from the Timeline view", async ({ page }) => {
      await page.goto(TIMELINE_PATH);
      await expect(page.getByTestId("timeline-scroll-container")).toBeVisible({
        timeout: 15000,
      });

      await clickSetAndExpectDetail(page);
    });

    test("from the List view", async ({ page }) => {
      await page.goto(LIST_PATH);
      await expect(
        page.getByRole("region", { name: "Schedule by day" }),
      ).toBeVisible();

      await clickSetAndExpectDetail(page);
    });
  },
);

async function clickSetAndExpectDetail(page: Page) {
  await page.getByRole("link", { name: SET_NAME }).click();

  await expect(page).toHaveURL(new RegExp(`${SET_DETAIL_PATH}$`));
  await expect(page.getByRole("heading", { name: SET_NAME })).toBeVisible();
}
