import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should show login dialog when clicking sign in", async ({ page }) => {
    await page.goto("/");

    // "/" chains through several redirects (festival -> edition -> sets) before
    // the header renders, so wait for that to settle before looking for the button.
    await expect(page).toHaveURL(/\/editions\/[^/]+\/sets$/, { timeout: 15000 });

    // Look for a sign in button or link
    const signInButton = page
      .getByRole("button", { name: /sign in/i })
      .or(page.getByRole("link", { name: /sign in/i }))
      .or(page.getByText(/sign in/i))
      .first();

    await expect(signInButton).toBeVisible();
    await signInButton.click();

    // Should show auth dialog
    const authDialog = page.getByRole("dialog");
    await expect(authDialog).toBeVisible();
  });

  test("should have proper page title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/UpLine/i);
  });
});
