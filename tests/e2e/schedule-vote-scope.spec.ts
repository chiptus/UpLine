import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { signIn, generateTestEmail } from "../utils/login";
import { createGroupWithMember, addMemberToGroup } from "../utils/groups";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025".
const LIST_PATH = "/festivals/test/editions/2025/schedule/list";

// Sets seeded on Friday July 12, 2025 (see `public.sets` inserts in seed.sql).
const MAYA_SET_NAME = "Maya Jane Coles";

function voteGroup(page: Page, setName: string) {
  return page.getByRole("group", { name: `Vote for ${setName}` });
}

function listSchedule(page: Page) {
  return page.getByRole("region", { name: "Schedule by day" });
}

// Every sticky day header carries its own copy of the filter controls, so
// list-view assertions have to name a single day group.
function firstDayHeader(page: Page) {
  return listSchedule(page).getByRole("region").first();
}

function scopeSwitcher(page: Page) {
  return page.getByTestId("active-scope-switcher");
}

async function selectScope(page: Page, label: string) {
  await scopeSwitcher(page).click();
  await page.getByRole("menuitem", { name: label, exact: true }).click();
}

// Below md the chips live inside the filter sheet, not the day header.
// Uses a retrying wait (not a one-shot isVisible check) so a just-closed
// dropdown's transition can't be mistaken for the mobile layout.
async function selectMustGoChip(page: Page) {
  const headerChips = firstDayHeader(page).getByRole("group", {
    name: "Filter by my vote",
  });

  const isDesktop = await headerChips
    .waitFor({ state: "visible", timeout: 5000 })
    .then(() => true)
    .catch(() => false);

  if (!isDesktop) {
    await firstDayHeader(page).getByTestId("schedule-filters-trigger").click();
    const sheetChips = page
      .getByRole("dialog")
      .getByRole("group", { name: "Filter by my vote" });
    await expect(sheetChips).toBeVisible();
    await sheetChips.getByRole("button", { name: "Must Go" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Done" })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    return;
  }

  await headerChips.getByRole("button", { name: "Must Go" }).click();
}

test.describe("Schedule vote-chip scope follows the navbar Active Scope", () => {
  test.describe.configure({ mode: "serial" });

  let voterContext: BrowserContext;
  let voterPage: Page;
  let viewerContext: BrowserContext;
  let viewerPage: Page;
  let groupName: string;

  test.beforeAll(async ({ browser, baseURL, storageState }) => {
    voterContext = await browser.newContext({ baseURL, storageState });
    voterPage = await voterContext.newPage();
    const voterEmail = await signIn(voterPage, generateTestEmail());

    viewerContext = await browser.newContext({ baseURL, storageState });
    viewerPage = await viewerContext.newPage();
    const viewerEmail = await signIn(viewerPage, generateTestEmail());

    const group = await createGroupWithMember(voterEmail);
    groupName = group.groupName;
    await addMemberToGroup(group.groupId, viewerEmail);

    // The voter casts a Must Go vote that only the viewer's group scope
    // (not their own "me" vote) should surface.
    await voterPage.goto(LIST_PATH);
    await expect(listSchedule(voterPage)).toBeVisible();
    await voteGroup(voterPage, MAYA_SET_NAME)
      .getByRole("button", { name: "Must Go" })
      .click();
  });

  test.afterAll(async () => {
    await voterContext?.close();
    await viewerContext?.close();
  });

  test("group scope shows a teammate's vote, me scope hides it, everyone scope shows it", async () => {
    // Three scope switches plus chip selection and assertions comfortably
    // exceed the 30s CI default under slower browsers (e.g. firefox).
    test.setTimeout(60_000);

    await viewerPage.goto(LIST_PATH);
    await expect(listSchedule(viewerPage)).toBeVisible();

    await selectScope(viewerPage, groupName);
    await selectMustGoChip(viewerPage);
    await expect(voteGroup(viewerPage, MAYA_SET_NAME)).toBeVisible();

    await selectScope(viewerPage, "Me");
    await expect(voteGroup(viewerPage, MAYA_SET_NAME)).toHaveCount(0);

    await selectScope(viewerPage, "Everyone");
    await expect(voteGroup(viewerPage, MAYA_SET_NAME)).toBeVisible();
  });
});
