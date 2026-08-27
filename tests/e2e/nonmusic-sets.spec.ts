import { test, expect } from "@playwright/test";

// Seeded in supabase/seed.sql: festival "test" edition "2025" carries two
// artist-less sets — "Morning Yoga Workshop" (set_type: workshop, with an
// external URL) and "Mystery Closing Ritual" (untyped legacy set).
const EDITION_SETS_PATH = "/festivals/test/editions/2025/sets";

test.describe("Non-music and artist-less sets", { tag: "@smoke" }, () => {
  test("renders a typed 0-artist set's detail page with banner, about and vote", async ({
    page,
  }) => {
    await page.goto(`${EDITION_SETS_PATH}/morning-yoga-workshop`);

    await expect(
      page.getByRole("heading", { name: "Morning Yoga Workshop" }),
    ).toBeVisible();
    await expect(page.getByText("Workshop", { exact: true })).toBeVisible();
    await expect(page.getByText("About")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /more info/i }),
    ).toHaveAttribute("href", "https://example.com/yoga-signup");
    await expect(page.getByText("Your vote")).toBeVisible();
  });

  test("renders an untyped 0-artist set's detail page without crashing (regression)", async ({
    page,
  }) => {
    await page.goto(`${EDITION_SETS_PATH}/mystery-closing-ritual`);

    await expect(
      page.getByRole("heading", { name: "Mystery Closing Ritual" }),
    ).toBeVisible();
    // Untyped falls back to the "other" treatment
    await expect(page.getByText("Other", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /more info/i })).toHaveCount(0);
  });

  test("shows artist-less sets in the vote list", async ({ page }) => {
    await page.goto(EDITION_SETS_PATH);

    const workshopItem = page
      .getByTestId("artist-item")
      .filter({ hasText: "Morning Yoga Workshop" });
    await expect(workshopItem).toBeVisible();
    // The card renders mobile + desktop layouts (one hidden), so the badge
    // exists twice — filter to the visible one
    await expect(
      workshopItem
        .getByText("Workshop", { exact: true })
        .filter({ visible: true }),
    ).toBeVisible();

    await expect(
      page
        .getByTestId("artist-item")
        .filter({ hasText: "Mystery Closing Ritual" }),
    ).toBeVisible();
  });
});
