import { test, expect, Page } from "@playwright/test";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025".
const LIST_PATH = "/festivals/test/editions/2025/schedule/list";

test.describe("Mobile bottom tab bar auto-hide", { tag: "@smoke" }, () => {
  test("hides on scroll down and returns on scroll up", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(LIST_PATH);

    const tabBar = page.getByTestId("mobile-tab-bar");
    await expect(tabBar).toBeVisible();
    await expect(tabBar).not.toHaveClass(/translate-y-full/);

    await scrollBy(page, 600);
    await expect(tabBar).toHaveClass(/translate-y-full/);

    await scrollBy(page, -600);
    await expect(tabBar).not.toHaveClass(/translate-y-full/);
  });
});

// window.scrollBy rather than mouse.wheel: mobile WebKit has no wheel.
async function scrollBy(page: Page, y: number) {
  await page.evaluate((amount) => window.scrollBy(0, amount), y);
}
