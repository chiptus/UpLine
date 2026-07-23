import { test, expect } from "@playwright/test";
import { signIn, generateTestEmail } from "../utils/login";
import { createGroupWithMember } from "../utils/groups";

test.describe("Active group", () => {
  test("auto-activates a user's sole group and shows it in the header", async ({
    page,
  }) => {
    const email = generateTestEmail();
    await signIn(page, email);

    const { groupName } = await createGroupWithMember(email);

    await page.goto("/");
    await page.reload();

    await expect(
      page.getByRole("link", { name: new RegExp(groupName, "i") }),
    ).toBeVisible({ timeout: 15000 });
  });
});
