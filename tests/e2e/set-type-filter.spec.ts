import { test, expect } from "@playwright/test";

// Seeded in supabase/seed.sql: "Morning Yoga Workshop" is the only
// workshop-typed set in the "test" festival's 2025 edition.
const EDITION_SETS_PATH = "/festivals/test/editions/2025/sets";

test.describe("Set type filter", { tag: "@smoke" }, () => {
  test("filtering to workshops leaves only workshop sets", async ({ page }) => {
    await page.goto(EDITION_SETS_PATH);

    const items = page.getByTestId("artist-item");
    await expect(items.first()).toBeVisible();

    await page.getByRole("button", { name: /Filters/ }).click();
    await page.getByRole("button", { name: "Workshop" }).click();

    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText("Morning Yoga Workshop");
    // TanStack Router JSON-serializes array search params: types=["workshop"]
    await expect(page).toHaveURL(/types=%5B%22workshop%22%5D/);
    // The active type selection counts toward the filter badge
    await expect(
      page.getByRole("button", { name: /Filters/ }).getByText("1"),
    ).toBeVisible();

    // Deselecting restores the full list
    await page.getByRole("button", { name: "Workshop" }).click();
    await expect(items.first()).toBeVisible();
    await expect(items).not.toHaveCount(1);
  });
});
