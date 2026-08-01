import { test, expect } from "@playwright/test";
import { submitOtpSignIn, generateTestEmail } from "../utils/login";
import { TEST_CONFIG } from "../config/test-env";

test.describe("Onboarding", { tag: "@smoke" }, () => {
  test("a brand-new voter is shown the onboarding dialog after sign-in", async ({
    page,
  }) => {
    await submitOtpSignIn(page, generateTestEmail());

    await expect(
      page.getByRole("dialog", { name: /welcome to upline/i }),
    ).toBeVisible();
  });

  test("an existing, already-onboarded voter is not shown onboarding", async ({
    page,
  }) => {
    await submitOtpSignIn(page, TEST_CONFIG.SEEDED_ONBOARDED_USER_EMAIL);

    await expect(page.getByRole("button", { name: /user menu/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("dialog", { name: /welcome to upline/i }),
    ).not.toBeVisible();
  });
});
