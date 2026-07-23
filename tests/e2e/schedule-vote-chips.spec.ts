import { test, expect } from "@playwright/test";
import { TestHelpers } from "../utils/test-helpers";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025".
const TIMELINE_PATH = "/festivals/test/editions/2025/schedule/timeline";
const LIST_PATH = "/festivals/test/editions/2025/schedule/list";

// Sets seeded on Friday July 12, 2025 (see `public.sets` inserts in seed.sql).
const MAYA_SET_NAME = "Maya Jane Coles";
const BEN_SET_NAME = "Ben Böhmer";
const KIARA_SET_NAME = "Kiara Scuro";

function voteGroup(page: import("@playwright/test").Page, setName: string) {
  return page.getByRole("group", { name: `Vote for ${setName}` });
}

async function signIn(page: import("@playwright/test").Page) {
  await new TestHelpers(page).signIn();
}

test.describe("My-vote chips", () => {
  test("do not render for logged-out visitors on either view", async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);
    await expect(
      page.getByTestId("timeline-scroll-container"),
    ).toBeVisible();

    await expect(
      page.getByRole("group", { name: "Filter by my vote" }),
    ).toHaveCount(0);

    await page.goto(LIST_PATH);
    await expect(page.getByTestId("list-schedule")).toBeVisible();

    await expect(
      page.getByRole("group", { name: "Filter by my vote" }),
    ).toHaveCount(0);
  });

  test("a shared ?votes= link is inert for logged-out visitors - sets still show", async ({
    page,
  }) => {
    await page.goto(`${LIST_PATH}?votes=mustGo`);
    await expect(page.getByTestId("list-schedule")).toBeVisible();

    // No viewer identity, so the vote filter must not empty the schedule.
    await expect(voteGroup(page, MAYA_SET_NAME)).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Filter by my vote" }),
    ).toHaveCount(0);
    // The badge must not advertise the inert vote filter.
    await expect(page.getByTestId("schedule-filters-badge")).toHaveCount(0);
  });

  test("two-tap 'my schedule': Must Go + Interested filters both views to the viewer's own votes", async ({
    page,
  }) => {
    await signIn(page);

    await page.goto(LIST_PATH);
    await expect(page.getByTestId("list-schedule")).toBeVisible();

    // Vote Must Go on one set and Interested on another, leaving a third
    // (Kiara Scuro) unvoted.
    await voteGroup(page, MAYA_SET_NAME)
      .getByRole("button", { name: "Must Go" })
      .click();
    await voteGroup(page, BEN_SET_NAME)
      .getByRole("button", { name: "Interested" })
      .click();

    const chips = page.getByRole("group", { name: "Filter by my vote" });
    await expect(chips).toBeVisible();

    await chips.getByRole("button", { name: "Must Go" }).click();
    await chips.getByRole("button", { name: "Interested" }).click();

    await expect(page).toHaveURL(/votes=/);
    await expect(page.getByTestId("schedule-filters-badge")).toHaveText("2");

    await expect(voteGroup(page, MAYA_SET_NAME)).toBeVisible();
    await expect(voteGroup(page, BEN_SET_NAME)).toBeVisible();
    await expect(voteGroup(page, KIARA_SET_NAME)).toHaveCount(0);

    // Shared URL state: the Timeline view sees the same selection and badge.
    const url = new URL(page.url());
    await page.goto(`${TIMELINE_PATH}${url.search}`);
    await expect(
      page.getByTestId("timeline-scroll-container"),
    ).toBeVisible();

    await expect(page.getByTestId("schedule-filters-badge")).toHaveText("2");
    await expect(voteGroup(page, MAYA_SET_NAME)).toBeVisible();
    await expect(voteGroup(page, KIARA_SET_NAME)).toHaveCount(0);
  });
});
