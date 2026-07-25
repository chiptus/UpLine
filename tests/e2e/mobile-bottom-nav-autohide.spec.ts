import { test, expect } from "@playwright/test";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025".
const LIST_PATH = "/festivals/test/editions/2025/schedule/list";

test.describe("Mobile bottom tab bar auto-hide", () => {
  test("hides on scroll down and returns on scroll up", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(LIST_PATH);

    const listSchedule = page.getByTestId("list-schedule");
    if (!(await listSchedule.isVisible().catch(() => false))) {
      test.skip(true, "Schedule not revealed in this environment");
    }

    const tabBar = page.getByTestId("mobile-tab-bar");
    await expect(tabBar).toBeVisible();
    await expect(tabBar).not.toHaveClass(/translate-y-full/);

    await page.mouse.wheel(0, 600);
    await expect(tabBar).toHaveClass(/translate-y-full/);

    await page.mouse.wheel(0, -600);
    await expect(tabBar).not.toHaveClass(/translate-y-full/);
  });
});
