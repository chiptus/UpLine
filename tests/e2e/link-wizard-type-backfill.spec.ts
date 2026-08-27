import { test, expect } from "@playwright/test";
import { signInAsAdmin } from "../utils/login";
import {
  createUntypedSetFixture,
  deleteUntypedSetFixture,
  getSetType,
  type UntypedSetFixture,
} from "../utils/linkWizardArtist";

const LINK_WIZARD_PATH = "/admin/festivals/test/editions/2025/links";

test.describe("Link Wizard: set-type backfill flow", { tag: "@smoke" }, () => {
  let fixture: UntypedSetFixture;

  test.beforeEach(async ({ page }) => {
    fixture = await createUntypedSetFixture();

    await signInAsAdmin(page);
    await page.goto(LINK_WIZARD_PATH);
    await expect(
      page.getByRole("heading", { name: /link wizard/i }),
    ).toBeVisible({ timeout: 15000 });
  });

  test.afterEach(async () => {
    await deleteUntypedSetFixture(fixture);
  });

  test("backfills a type through the wizard: select set → pick type → save → drops out of queue", async ({
    page,
  }) => {
    test.setTimeout(60000);

    // The artist-less untyped set appears in the mixed queue as its own item.
    const queueRow = page
      .getByRole("listitem")
      .filter({ hasText: fixture.setName });
    await expect(queueRow).toBeVisible({ timeout: 15000 });

    await queueRow.getByRole("button", { name: fixture.setName }).click();
    await expect(
      page.getByRole("heading", {
        name: new RegExp(`link wizard.*${fixture.setName}`, "i"),
      }),
    ).toBeVisible();

    // Read-only set details render above the type picker.
    const detailsPanel = page.getByRole("region", {
      name: new RegExp(`${fixture.setName} - Set Details`, "i"),
    });
    await expect(detailsPanel).toBeVisible();
    await expect(
      detailsPanel.getByRole("heading", { name: fixture.setName, exact: true }),
    ).toBeVisible();
    await expect(detailsPanel.getByText("Stage: Club Stage")).toBeVisible();
    await expect(page.getByText("This set has no type yet")).toBeVisible();

    // Save is disabled until a type is chosen.
    const saveButton = page.getByRole("button", { name: /save & next/i });
    await expect(saveButton).toBeDisabled();

    const typePicker = page.getByRole("group", {
      name: `Type for ${fixture.setName}`,
    });
    await typePicker.getByRole("button", { name: "Workshop" }).click();
    await expect(
      typePicker.getByRole("button", { name: "Workshop" }),
    ).toHaveAttribute("aria-pressed", "true");

    // Assert on the PATCH response rather than the transient success toast.
    const [patchResponse] = await Promise.all([
      page.waitForResponse(
        (response) => {
          if (
            response.request().method() !== "PATCH" ||
            !response.url().includes("/rest/v1/sets") ||
            !response.url().includes(fixture.setId)
          ) {
            return false;
          }
          const body = response.request().postDataJSON();
          return body?.set_type === "workshop";
        },
        { timeout: 30000 },
      ),
      saveButton.click(),
    ]);
    expect(patchResponse.ok()).toBe(true);

    expect(await getSetType(fixture.setId)).toBe("workshop");

    // Once typed, the set drops out of the queue.
    await expect(queueRow).toHaveCount(0, { timeout: 15000 });
  });
});
