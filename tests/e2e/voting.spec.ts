import {
  test,
  expect,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import { TestHelpers } from "../utils/test-helpers";

// Seeded via supabase/seed.sql: "Test festival" edition "Boom Festival 2025".
const EDITION_SETS_PATH = "/festivals/test/editions/2025/sets";

// Each scenario below targets a distinct seeded set so that parallel runs
// (and parallel Playwright projects) never race over the same votes row.
test.describe("Voting on a set", () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await new TestHelpers(page).signIn();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test("casts a Must Go vote and reflects the selected state", async () => {
    const setCard = await goToSet(page, "Maya Jane Coles");
    const mustGo = voteButton(setCard, "mustGo");

    await mustGo.click();

    await expect(mustGo).toHaveAttribute("aria-pressed", "true");
    await expect(voteButton(setCard, "interested")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(voteButton(setCard, "wontGo")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("casts an Interested vote and reflects the selected state", async () => {
    const setCard = await goToSet(page, "Ben Böhmer");
    const interested = voteButton(setCard, "interested");

    await interested.click();

    await expect(interested).toHaveAttribute("aria-pressed", "true");
  });

  test("casts a Won't Go vote and reflects the selected state", async () => {
    const setCard = await goToSet(page, "Kiara Scuro");
    const wontGo = voteButton(setCard, "wontGo");

    await wontGo.click();

    await expect(wontGo).toHaveAttribute("aria-pressed", "true");
  });

  test("persists a vote across a reload", async () => {
    const setCard = await goToSet(page, "Nils Frahm");
    const mustGo = voteButton(setCard, "mustGo");

    await mustGo.click();
    await expect(mustGo).toHaveAttribute("aria-pressed", "true");

    await page.reload();
    await page.waitForLoadState("networkidle");

    const setCardAfterReload = page
      .getByTestId("artist-item")
      .filter({ hasText: "Nils Frahm" });
    await expect(voteButton(setCardAfterReload, "mustGo")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("changes a vote from one type to another instead of adding a second vote", async () => {
    const setCard = await goToSet(page, "Charlotte de Witte");
    const mustGo = voteButton(setCard, "mustGo");
    const interested = voteButton(setCard, "interested");
    const mustGoCount = voteCount(setCard, "mustGo");
    const interestedCount = voteCount(setCard, "interested");

    await mustGo.click();
    await expect(mustGo).toHaveAttribute("aria-pressed", "true");

    const mustGoCountAfterFirstVote = await readCount(mustGoCount);
    const interestedCountBeforeSwitch = await readCount(interestedCount);

    await interested.click();

    await expect(interested).toHaveAttribute("aria-pressed", "true");
    await expect(mustGo).toHaveAttribute("aria-pressed", "false");
    await expect(mustGoCount).toHaveText(String(mustGoCountAfterFirstVote - 1));
    await expect(interestedCount).toHaveText(
      String(interestedCountBeforeSwitch + 1),
    );
  });

  test("removes a vote and returns the set to the unvoted state", async () => {
    const setCard = await goToSet(page, "Four Tet");
    const mustGo = voteButton(setCard, "mustGo");
    const mustGoCount = voteCount(setCard, "mustGo");

    await mustGo.click();
    await expect(mustGo).toHaveAttribute("aria-pressed", "true");
    const countAfterVote = await readCount(mustGoCount);

    await mustGo.click();

    await expect(mustGo).toHaveAttribute("aria-pressed", "false");
    await expect(mustGoCount).toHaveText(String(countAfterVote - 1));
  });
});

test.describe("Voting without authentication", () => {
  test("an unauthenticated vote attempt surfaces the sign-in prompt", async ({
    page,
  }) => {
    const testHelpers = new TestHelpers(page);
    await testHelpers.navigateTo(EDITION_SETS_PATH);

    const setCard = page
      .getByTestId("artist-item")
      .filter({ hasText: "Moderat" });
    const mustGo = voteButton(setCard, "mustGo");

    await mustGo.click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(mustGo).toHaveAttribute("aria-pressed", "false");
  });
});

async function goToSet(page: Page, setName: string): Promise<Locator> {
  await page.goto(EDITION_SETS_PATH);
  await page.waitForLoadState("networkidle");

  const setCard = page.getByTestId("artist-item").filter({ hasText: setName });
  await expect(setCard).toBeVisible();
  return setCard;
}

function voteButton(
  setCard: Locator,
  voteType: "mustGo" | "interested" | "wontGo",
): Locator {
  return setCard.locator(`[data-testid="vote-button-${voteType}"]:visible`);
}

function voteCount(
  setCard: Locator,
  voteType: "mustGo" | "interested" | "wontGo",
): Locator {
  return setCard.locator(`[data-testid="vote-count-${voteType}"]:visible`);
}

async function readCount(locator: Locator): Promise<number> {
  const text = (await locator.textContent()) ?? "";
  const match = text.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}
