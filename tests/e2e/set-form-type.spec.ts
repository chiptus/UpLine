import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "../utils/login";

const ADMIN_SETS_PATH = "/admin/festivals/test/editions/2025/sets";

test.describe("Admin set form: set types", { tag: "@smoke" }, () => {
  test("creates a workshop with no artists via the form", async ({ page }) => {
    const setName = `Breathwork Circle ${Date.now()}`;

    await signInAsAdmin(page);
    await page.goto(ADMIN_SETS_PATH);

    await page.getByRole("button", { name: "Add Set" }).click();
    const dialog = page.getByRole("dialog");

    // Submitting without a type is rejected
    await dialog.getByLabel("Set Name").fill(setName);
    await dialog.getByRole("button", { name: "Create" }).click();
    await expect(dialog.getByText("Type is required")).toBeVisible();

    await dialog.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Workshop" }).click();

    // Non-music phrasing on the artist picker
    await expect(dialog.getByText("Artists (optional)")).toBeVisible();

    await dialog
      .getByLabel("External URL")
      .fill("https://example.com/breathwork");
    await dialog.getByRole("button", { name: "Create" }).click();

    await expect(dialog).not.toBeVisible();
    await expect(page.getByText(setName)).toBeVisible();
  });

  test("rejects an invalid external URL", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto(ADMIN_SETS_PATH);

    await page.getByRole("button", { name: "Add Set" }).click();
    const dialog = page.getByRole("dialog");

    await dialog.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Other" }).click();
    await dialog.getByLabel("Set Name").fill("Broken Link Set");
    await dialog.getByLabel("External URL").fill("not-a-url");
    await dialog.getByRole("button", { name: "Create" }).click();

    await expect(dialog.getByText("Enter a valid URL")).toBeVisible();
  });
});
