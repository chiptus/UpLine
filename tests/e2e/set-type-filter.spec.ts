import { test, expect } from "@playwright/test";

// Seeded in supabase/seed.sql: "Morning Yoga Workshop" is a workshop-typed
// set in the "test" festival's 2025 edition. Other specs running in parallel
// (e.g. set-form-type.spec.ts) may create additional workshop sets in the
// same edition, so assertions avoid exact counts.
const EDITION_SETS_PATH = "/festivals/test/editions/2025/sets";

test.describe("Set type filter", { tag: "@smoke" }, () => {
  test("filtering to workshops leaves only workshop sets", async ({ page }) => {
    await page.goto(EDITION_SETS_PATH);

    const items = page.getByTestId("artist-item");
    await expect(items.first()).toBeVisible();

    await page.getByRole("button", { name: /Filters/ }).click();
    await page.getByRole("button", { name: "Workshop" }).click();

    await expect(
      items.filter({ hasText: "Morning Yoga Workshop" }),
    ).toBeVisible();
    // Seeded music sets are filtered out
    await expect(items.filter({ hasText: "Maya Jane Coles" })).toHaveCount(0);
    // TanStack Router JSON-serializes array search params: types=["workshop"]
    await expect(page).toHaveURL(/types=%5B%22workshop%22%5D/);
    // The active type selection counts toward the filter badge
    await expect(
      page.getByRole("button", { name: /Filters/ }).getByText("1"),
    ).toBeVisible();

    // Deselecting restores the full list
    await page.getByRole("button", { name: "Workshop" }).click();
    await expect(items.filter({ hasText: "Maya Jane Coles" })).toBeVisible();
  });
});
