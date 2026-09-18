import {
  test,
  expect,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import { signIn } from "../utils/login";

test.describe("Group lifecycle", () => {
  // Each stage (create -> invite -> join -> leave) depends on state built up
  // by the previous one, so these must run in order and never concurrently.
  test.describe.configure({ mode: "serial" });

  let creatorContext: BrowserContext;
  let creatorPage: Page;
  let creatorEmail: string;

  let joinerContext: BrowserContext;
  let joinerPage: Page;
  let joinerEmail: string;

  let outsiderContext: BrowserContext;
  let outsiderPage: Page;

  let groupName: string;
  let groupSlug: string;
  let inviteToken: string;

  test.beforeAll(async ({ browser, baseURL, storageState }) => {
    creatorContext = await browser.newContext({ baseURL, storageState });
    creatorPage = await creatorContext.newPage();
    creatorEmail = await signIn(creatorPage);

    joinerContext = await browser.newContext({ baseURL, storageState });
    joinerPage = await joinerContext.newPage();
    joinerEmail = await signIn(joinerPage);

    outsiderContext = await browser.newContext({ baseURL, storageState });
    outsiderPage = await outsiderContext.newPage();
    await signIn(outsiderPage);
  });

  test.afterAll(async () => {
    await creatorContext?.close();
    await joinerContext?.close();
    await outsiderContext?.close();
  });

  test("creates a group and lists it under My Groups", async () => {
    groupName = `E2E Group ${Date.now()}`;

    await creatorPage.goto("/groups");
    await creatorPage.getByRole("button", { name: "Create Group" }).click();

    const dialog = creatorPage.getByRole("dialog");
    await dialog.getByLabel("Group Name").fill(groupName);
    await dialog.getByRole("button", { name: "Create Group" }).click();

    await expect(creatorPage).toHaveURL(/\/groups\/[^/]+$/);
    groupSlug = creatorPage.url().split("/groups/")[1];

    await creatorPage.goto("/groups");
    await expect(groupCard(creatorPage, groupName)).toBeVisible();
  });

  test("creator sees the member list and generates an invite link", async () => {
    await creatorPage.goto(`/groups/${groupSlug}`);

    await expect(
      creatorPage.getByRole("heading", { name: "Group Members (1)" }),
    ).toBeVisible();
    await expect(
      creatorPage.getByText(`${usernameOf(creatorEmail)} (You)`),
    ).toBeVisible();

    await creatorPage.getByRole("tab", { name: "Invite Links" }).click();

    const [inviteRequest] = await Promise.all([
      creatorPage.waitForRequest(
        (request) =>
          request.url().includes("/rest/v1/group_invites") &&
          request.method() === "POST",
      ),
      creatorPage.getByRole("button", { name: "Generate Invite Link" }).click(),
    ]);

    inviteToken = (inviteRequest.postDataJSON() as { invite_token: string })
      .invite_token;
    expect(inviteToken).toBeTruthy();
  });

  test("a second user joins via the invite link and then sees the group", async () => {
    const acceptResponse = joinerPage.waitForResponse(
      (response) =>
        response.url().includes("/rest/v1/rpc/use_invite_token") &&
        response.ok(),
    );
    await joinerPage.goto(`/invite?token=${inviteToken}`);
    await acceptResponse;

    await joinerPage.goto("/groups");
    await expect(groupCard(joinerPage, groupName)).toBeVisible();

    await creatorPage.goto(`/groups/${groupSlug}`);
    await expect(
      creatorPage.getByRole("heading", { name: "Group Members (2)" }),
    ).toBeVisible();
    await expect(
      creatorPage.getByText(usernameOf(joinerEmail), { exact: true }),
    ).toBeVisible();
  });

  test("a non-member cannot see the group's data", async () => {
    await outsiderPage.goto(`/groups/${groupSlug}`);
    await expect(
      outsiderPage.getByText("Group not found or you don't have access"),
    ).toBeVisible();

    await outsiderPage.goto("/groups");
    await expect(groupCard(outsiderPage, groupName)).toHaveCount(0);
  });

  test("leaving a group removes it from the member's list", async () => {
    await joinerPage.goto("/groups");
    const card = groupCard(joinerPage, groupName);
    await expect(card).toBeVisible();

    await card.getByRole("button", { name: "Leave" }).click();

    const confirmDialog = joinerPage.getByRole("alertdialog");
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Leave" }).click();

    await expect(card).toHaveCount(0);
  });
});

function groupCard(page: Page, name: string): Locator {
  return page.locator('a[href^="/groups/"]').filter({ hasText: name });
}

function usernameOf(email: string): string {
  return email.split("@")[0];
}
