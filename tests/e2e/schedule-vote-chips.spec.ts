import { test, expect } from "@playwright/test";
import { TestHelpers } from "../utils/test-helpers";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025".
const TIMELINE_PATH = "/festivals/test/editions/2025/schedule/timeline";
const LIST_PATH = "/festivals/test/editions/2025/schedule/list";

// Sets seeded on Friday July 12, 2025 (see `public.sets` inserts in seed.sql).
const MAYA_SET_ID = "11111111-1111-1111-1111-111111111111";
const BEN_SET_ID = "22222222-2222-2222-2222-222222222222";
const KIARA_SET_ID = "33333333-3333-3333-3333-333333333333";

async function signInOrSkip(page: import("@playwright/test").Page) {
  const testHelpers = new TestHelpers(page);
  try {
    await testHelpers.signIn();
  } catch {
    // Ignore - handled by the isAuthenticated check below.
  }

  const authenticated = await testHelpers.isAuthenticated();
  test.skip(
    !authenticated,
    "Seeded environment can't authenticate a voting user",
  );
}

test.describe("My-vote chips", () => {
  test("do not render for logged-out visitors on either view", async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    const scrollContainer = page.getByTestId("timeline-scroll-container");
    if (!(await scrollContainer.isVisible().catch(() => false))) {
      test.skip(true, "Schedule not revealed in this environment");
    }

    await expect(page.getByTestId("vote-filter-chips")).toHaveCount(0);

    await page.goto(LIST_PATH);
    const listSchedule = page.getByTestId("list-schedule");
    if (!(await listSchedule.isVisible().catch(() => false))) {
      test.skip(true, "Schedule not revealed in this environment");
    }

    await expect(page.getByTestId("vote-filter-chips")).toHaveCount(0);
  });

  test("a shared ?votes= link is inert for logged-out visitors - sets still show", async ({
    page,
  }) => {
    await page.goto(`${LIST_PATH}?votes=mustGo`);

    const listSchedule = page.getByTestId("list-schedule");
    if (!(await listSchedule.isVisible().catch(() => false))) {
      test.skip(true, "Schedule not revealed in this environment");
    }

    // No viewer identity, so the vote filter must not empty the schedule.
    await expect(
      page.getByTestId(`vote-buttons-${MAYA_SET_ID}`),
    ).toBeVisible();
    await expect(page.getByTestId("vote-filter-chips")).toHaveCount(0);
    // The badge must not advertise the inert vote filter.
    await expect(page.getByTestId("schedule-filters-badge")).toHaveCount(0);
  });

  test("two-tap 'my schedule': Must Go + Interested filters both views to the viewer's own votes", async ({
    page,
  }) => {
    await signInOrSkip(page);

    await page.goto(LIST_PATH);
    const listSchedule = page.getByTestId("list-schedule");
    if (!(await listSchedule.isVisible().catch(() => false))) {
      test.skip(true, "Schedule not revealed in this environment");
    }

    // Vote Must Go on one set and Interested on another, leaving a third
    // (Kiara Scuro) unvoted.
    await page
      .getByTestId(`vote-buttons-${MAYA_SET_ID}`)
      .getByTestId("vote-button-mustGo")
      .click();
    await page
      .getByTestId(`vote-buttons-${BEN_SET_ID}`)
      .getByTestId("vote-button-interested")
      .click();

    await expect(page.getByTestId("vote-filter-chips")).toBeVisible();

    // Two taps: Must Go, then Interested.
    await page.getByTestId("vote-filter-chip-mustGo").click();
    await page.getByTestId("vote-filter-chip-interested").click();

    await expect(page).toHaveURL(/votes=/);
    await expect(page.getByTestId("schedule-filters-badge")).toHaveText("2");

    await expect(
      page.getByTestId(`vote-buttons-${MAYA_SET_ID}`),
    ).toBeVisible();
    await expect(page.getByTestId(`vote-buttons-${BEN_SET_ID}`)).toBeVisible();
    await expect(
      page.getByTestId(`vote-buttons-${KIARA_SET_ID}`),
    ).toHaveCount(0);

    // Shared URL state: the Timeline view sees the same selection and badge.
    const url = new URL(page.url());
    await page.goto(`${TIMELINE_PATH}${url.search}`);

    const scrollContainer = page.getByTestId("timeline-scroll-container");
    if (!(await scrollContainer.isVisible().catch(() => false))) {
      test.skip(true, "Schedule not revealed in this environment");
    }

    await expect(page.getByTestId("schedule-filters-badge")).toHaveText("2");
    await expect(
      page.getByTestId(`vote-buttons-${MAYA_SET_ID}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`vote-buttons-${KIARA_SET_ID}`),
    ).toHaveCount(0);
  });
});
