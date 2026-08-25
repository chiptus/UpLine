import { test, expect } from "@playwright/test";

test.describe("Navigation", { tag: "@smoke" }, () => {
  test("should navigate to different pages", async ({ page }) => {
    await page.goto("/");

    // Test navigation to different pages if they exist
    const navigationLinks = [
      { name: /^artists$/i, path: "/" },
      { name: /^schedule$/i, path: "/schedule" },
      { name: /^groups$/i, path: "/groups" },
    ];

    for (const link of navigationLinks) {
      const navLink = page
        .getByRole("link", { name: link.name })
        .or(page.getByRole("button", { name: link.name }));

      if (await navLink.isVisible()) {
        await navLink.click();
        await expect(page).toHaveURL(new RegExp(link.path));
      }
    }
  });

  test("should handle 404 page", async ({ page }) => {
    await page.goto("/non-existent-page");

    // Should show 404 or error page
    const errorContent = page
      .getByText(/not found/i)
      .or(page.getByText(/404/i))
      .or(page.getByText(/page not found/i))
      .first();

    await expect(errorContent).toBeVisible();
  });
});
