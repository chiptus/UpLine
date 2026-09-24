import {
  test,
  expect,
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  type Locator,
  type Page,
} from "@playwright/test";
import { signIn, usernameFromEmail } from "../utils/login";

test("group lifecycle: create, invite, join, isolate, leave", async ({
  browser,
  baseURL,
  storageState,
}) => {
  const creator = await newSignedInPage(browser, baseURL, storageState);
  const joiner = await newSignedInPage(browser, baseURL, storageState);
  const outsider = await newSignedInPage(browser, baseURL, storageState);

  const groupName = `E2E Group ${Date.now()}`;
  let groupSlug = "";
  let inviteToken = "";

  try {
    await test.step("creator creates a group and sees it under My Groups", async () => {
      await creator.page.goto("/groups");
      await creator.page.getByRole("button", { name: "Create Group" }).click();

      const dialog = creator.page.getByRole("dialog");
      await dialog.getByLabel("Group Name").fill(groupName);
      await dialog.getByRole("button", { name: "Create Group" }).click();

      await expect(creator.page).toHaveURL(/\/groups\/[^/]+$/);
      groupSlug = creator.page.url().split("/groups/")[1];

      await creator.page.goto("/groups");
      await expect(groupCard(creator.page, groupName)).toBeVisible();
    });

    await test.step("creator sees the member list and generates an invite link", async () => {
      await creator.page.goto(`/groups/${groupSlug}`);

      await expect(
        creator.page.getByRole("heading", { name: "Group Members (1)" }),
      ).toBeVisible();
      await expect(
        creator.page.getByText(`${usernameFromEmail(creator.email)} (You)`),
      ).toBeVisible();

      await creator.page.getByRole("tab", { name: "Invite Links" }).click();

      // Reading the clipboard is unreliable across browser projects, so the
      // token is taken from the insert request instead.
      const [inviteRequest] = await Promise.all([
        creator.page.waitForRequest(
          (request) =>
            request.url().includes("/rest/v1/group_invites") &&
            request.method() === "POST",
        ),
        creator.page
          .getByRole("button", { name: "Generate Invite Link" })
          .click(),
      ]);

      inviteToken = (inviteRequest.postDataJSON() as { invite_token: string })
        .invite_token;
      expect(inviteToken).toBeTruthy();

      await expect(
        creator.page.getByText("Active", { exact: true }),
      ).toBeVisible();
    });

    await test.step("a second user joins via the invite link and then sees the group", async () => {
      const acceptResponse = joiner.page.waitForResponse(
        (response) =>
          response.url().includes("/rest/v1/rpc/use_invite_token") &&
          response.ok(),
      );
      // Same shape as the link useGenerateInviteMutation produces, so the
      // root route's ?invite= redirect is exercised too.
      await joiner.page.goto(`/?invite=${inviteToken}`);
      await acceptResponse;

      await joiner.page.goto("/groups");
      await expect(groupCard(joiner.page, groupName)).toBeVisible();

      await creator.page.goto(`/groups/${groupSlug}`);
      await expect(
        creator.page.getByRole("heading", { name: "Group Members (2)" }),
      ).toBeVisible();
      await expect(
        creator.page.getByText(usernameFromEmail(joiner.email), {
          exact: true,
        }),
      ).toBeVisible();
    });

    await test.step("a non-member cannot see the group's data", async () => {
      await outsider.page.goto(`/groups/${groupSlug}`);
      await expect(
        outsider.page.getByText("Group not found or you don't have access"),
      ).toBeVisible();

      await outsider.page.goto("/groups");
      await expect(groupCard(outsider.page, groupName)).toHaveCount(0);
    });

    await test.step("leaving a group removes it from the member's list", async () => {
      await joiner.page.goto("/groups");
      const card = groupCard(joiner.page, groupName);
      await expect(card).toBeVisible();

      await card.getByRole("button", { name: "Leave" }).click();

      const confirmDialog = joiner.page.getByRole("alertdialog");
      await expect(confirmDialog).toBeVisible();
      await confirmDialog.getByRole("button", { name: "Leave" }).click();

      await expect(card).toHaveCount(0);
    });
  } finally {
    await creator.context.close();
    await joiner.context.close();
    await outsider.context.close();
  }
});

function groupCard(page: Page, name: string): Locator {
  return page.locator('a[href^="/groups/"]').filter({ hasText: name });
}

// Opens a fresh, isolated browser context signed in as a new test user.
async function newSignedInPage(
  browser: Browser,
  baseURL: string | undefined,
  storageState: BrowserContextOptions["storageState"],
): Promise<{ context: BrowserContext; page: Page; email: string }> {
  const context = await browser.newContext({ baseURL, storageState });
  const page = await context.newPage();
  const email = await signIn(page);
  return { context, page, email };
}
