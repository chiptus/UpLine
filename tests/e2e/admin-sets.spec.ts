import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "../utils/admin";

const SETS_MANAGEMENT_PATH = "/admin/festivals/test/editions/2025/sets";

test.describe("Admin set management", () => {
  test("creates a set and edits its name", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto(SETS_MANAGEMENT_PATH);

    const setName = `E2E Test Set ${Date.now()}`;
    const updatedSetName = `${setName} (Updated)`;

    await page.getByRole("button", { name: /add set/i }).click();

    const createDialog = page.getByRole("dialog", { name: /create new set/i });
    await expect(createDialog).toBeVisible();
    await createDialog.getByLabel(/set name/i).fill(setName);
    await createDialog.getByRole("button", { name: /^create$/i }).click();
    await expect(createDialog).not.toBeVisible();

    const row = page.getByRole("row", { name: new RegExp(setName) });
    await expect(row).toBeVisible();

    await row.getByRole("button").first().click();

    const editDialog = page.getByRole("dialog", { name: /edit set/i });
    await expect(editDialog).toBeVisible();
    const nameField = editDialog.getByLabel(/set name/i);
    await nameField.fill(updatedSetName);
    await editDialog.getByRole("button", { name: /^update$/i }).click();
    await expect(editDialog).not.toBeVisible();

    await expect(
      page.getByRole("row", { name: new RegExp(updatedSetName) }),
    ).toBeVisible();
  });
});
