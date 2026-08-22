import { test, expect } from "@playwright/test";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025".

test.describe("Invalid festival/edition slugs", { tag: "@smoke" }, () => {
  test("shows edition-specific not found UI for an invalid edition slug", async ({
    page,
  }) => {
    await page.goto("/festivals/test/editions/does-not-exist");

    await expect(
      page.getByRole("heading", { name: "Edition not found" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Back to festival" }).click();
    await expect(page).toHaveURL(/\/festivals\/test\/?(\?.*)?$/);
  });

  test("shows festival-specific not found UI for an invalid festival slug", async ({
    page,
  }) => {
    await page.goto("/festivals/does-not-exist");

    await expect(
      page.getByRole("heading", { name: "Festival not found" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Back to festivals" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
