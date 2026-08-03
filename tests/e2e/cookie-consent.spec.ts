import { test, expect } from "@playwright/test";

const CONSENT_KEY = "gdpr-consent";

test.describe("Cookie consent banner", { tag: "@smoke" }, () => {
  test("appears on a fresh visit with no stored consent", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Cookie Consent" }),
    ).toBeVisible();
  });

  test("does not appear once consent is already stored", async ({ page }) => {
    await page.addInitScript(
      ([key]) => {
        localStorage.setItem(
          key,
          JSON.stringify({
            essential: true,
            analytics: false,
            preferences: false,
            marketing: false,
            version: "1.0",
            timestamp: Date.now(),
          }),
        );
      },
      [CONSENT_KEY],
    );

    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Cookie Consent" }),
    ).not.toBeVisible();
  });

  test("accepting all dismisses the banner and persists the choice", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Accept All" }).click();

    await expect(
      page.getByRole("heading", { name: "Cookie Consent" }),
    ).not.toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Cookie Consent" }),
    ).not.toBeVisible();
  });
});
