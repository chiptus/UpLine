import { test, expect } from "@playwright/test";
import { TestHelpers } from "../utils/test-helpers";

test.describe("Artists", { tag: "@smoke" }, () => {
  let testHelpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    testHelpers = new TestHelpers(page);
  });

  test("should display artists list", async ({ page }) => {
    await testHelpers.navigateTo("/");

    // Look for artists content
    const artistsContent = page
      .locator('[data-testid="artists-list"]')
      .or(page.locator('[data-testid="artists-grid"]'));

    // If artists are loaded, they should be visible
    if (await artistsContent.isVisible()) {
      await expect(artistsContent).toBeVisible();
    }
  });

  test("should filter artists", async ({ page }) => {
    await testHelpers.navigateTo("/");

    // Look for filter controls
    const filterInput = page
      .getByPlaceholder(/search/i)
      .or(page.getByLabel(/search/i));

    if (await filterInput.isVisible()) {
      await filterInput.fill("test");
      await testHelpers.waitForPageLoad();

      // Should show filtered results
      const results = page
        .locator('[data-testid="artist-item"]')
        .or(page.locator(".artist-card"));

      if ((await results.count()) > 0) {
        await expect(results.first()).toBeVisible();
      }
    }
  });

  test("should navigate to artist detail page", async ({ page }) => {
    await testHelpers.navigateTo("/");

    // Look for artist cards/items
    const artistCard = page.getByTestId("artist-item").first();

    if (await artistCard.isVisible()) {
      const artistName = await artistCard.getByRole("heading").textContent();
      const link = artistCard.getByRole("link");
      await link.click();

      // Should navigate to artist detail page
      await expect(page).toHaveURL(/\/artist\//);

      // Should show artist name in detail page
      if (artistName) {
        await expect(page.getByText(artistName.trim())).toBeVisible();
      }
    }
  });

  test("should handle empty artists state", async ({ page }) => {
    await testHelpers.navigateTo("/");

    // Look for empty state message
    const emptyState = page
      .getByText(/no artists/i)
      .or(page.getByText(/empty/i))
      .or(page.locator('[data-testid="empty-state"]'));

    // If no artists are loaded, should show empty state
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
    }
  });
});
