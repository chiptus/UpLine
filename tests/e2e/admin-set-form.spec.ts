import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "../utils/login";

const ADMIN_SETS_PATH = "/admin/festivals/test/editions/2025/sets";

test.describe("Admin set form: set types", { tag: "@smoke" }, () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto(ADMIN_SETS_PATH);
    await expect(page.getByRole("button", { name: /add set/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test("creates a workshop with no artists via the form", async ({ page }) => {
    const workshopName = `E2E Workshop ${Date.now()}`;

    await page.getByRole("button", { name: /add set/i }).click();
    const dialog = page.getByRole("dialog", { name: /create new set/i });
    await expect(dialog).toBeVisible();

    // New sets can't be submitted without a type
    await dialog.getByLabel(/set name/i).fill(workshopName);
    await dialog.getByRole("button", { name: /^create$/i }).click();
    await expect(dialog.getByText("Type is required")).toBeVisible();

    // Pick Workshop; the artist picker relabels to optional facilitators
    await dialog.getByRole("combobox", { name: /type/i }).click();
    await page.getByRole("option", { name: /workshop/i }).click();
    await expect(dialog.getByText("Artists (optional)")).toBeVisible();

    await dialog
      .getByLabel(/external url/i)
      .fill("https://example.com/workshop-signup");
    await dialog.getByRole("button", { name: /^create$/i }).click();

    await expect(dialog).not.toBeVisible({ timeout: 15000 });
    await expect(page.getByText(workshopName)).toBeVisible();
  });
});
