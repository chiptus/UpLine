import {
  test,
  expect,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";
import { signIn } from "../utils/login";
import { RATING_CONFIG, type RatingType } from "../../src/lib/ratingConfig";

// Seeded via supabase/seed.sql: "Post Festival Test" edition, pinned to
// phase_override = 'post-festival' so the retrospective rating UI (rather
// than voting) is always shown, regardless of real wall-clock time.
const EDITION_SETS_PATH = "/festivals/post-test/editions/2025/sets";

// Each scenario below targets a distinct seeded set so that parallel runs
// never race over the same set_ratings row.
test.describe(
  "Rating a set in the Post-Festival phase",
  { tag: "@smoke" },
  () => {
    test.describe.configure({ mode: "serial" });

    let context: BrowserContext;
    let page: Page;

    test.beforeAll(async ({ browser, baseURL, storageState }) => {
      context = await browser.newContext({ baseURL, storageState });
      page = await context.newPage();
      await signIn(page);
    });

    test.afterAll(async () => {
      await context.close();
    });

    test("shows the Post-Festival rating UI instead of the voting UI", async () => {
      await page.goto(EDITION_SETS_PATH);

      const setCard = page
        .getByTestId("artist-item")
        .filter({ hasText: "Maya Jane Coles" });
      await expect(ratingButton(setCard, "loved")).toBeVisible();
      await expect(setCard.locator('button[aria-label="Must Go"]')).toHaveCount(
        0,
      );
    });

    test("rates a set Loved it and reflects the selected state", async () => {
      const setCard = await goToSet(page, "Maya Jane Coles");
      const loved = ratingButton(setCard, "loved");

      await loved.click();

      await expect(loved).toHaveAttribute("aria-pressed", "true");
      await expect(ratingButton(setCard, "liked")).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      await expect(ratingButton(setCard, "meh")).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });

    test("persists a rating across a reload", async () => {
      const setCard = await goToSet(page, "Ben Böhmer");
      const liked = ratingButton(setCard, "liked");

      const ratingWrite = page.waitForResponse(
        (response) =>
          response.url().includes("/rest/v1/set_ratings") &&
          response.request().method() !== "GET" &&
          response.ok(),
      );
      await liked.click();
      await expect(liked).toHaveAttribute("aria-pressed", "true");
      await ratingWrite;

      await page.reload();

      const setCardAfterReload = page
        .getByTestId("artist-item")
        .filter({ hasText: "Ben Böhmer" });
      await expect(ratingButton(setCardAfterReload, "liked")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    test("changes a rating from one type to another instead of adding a second rating", async () => {
      const setCard = await goToSet(page, "Kiara Scuro");
      const loved = ratingButton(setCard, "loved");
      const meh = ratingButton(setCard, "meh");

      await loved.click();
      await expect(loved).toHaveAttribute("aria-pressed", "true");

      await meh.click();

      await expect(meh).toHaveAttribute("aria-pressed", "true");
      await expect(loved).toHaveAttribute("aria-pressed", "false");
    });

    test("removes a rating and returns the set to the unrated state", async () => {
      const setCard = await goToSet(page, "Nils Frahm");
      const liked = ratingButton(setCard, "liked");

      await liked.click();
      await expect(liked).toHaveAttribute("aria-pressed", "true");

      await liked.click();

      await expect(liked).toHaveAttribute("aria-pressed", "false");
    });
  },
);

async function goToSet(page: Page, setName: string): Promise<Locator> {
  await page.goto(EDITION_SETS_PATH);

  const setCard = page.getByTestId("artist-item").filter({ hasText: setName });
  // The sets list can take a while to render under full parallel load.
  await expect(setCard).toBeVisible({ timeout: 20000 });
  return setCard;
}

function ratingButton(setCard: Locator, ratingType: RatingType): Locator {
  return setCard.locator(
    `button[aria-label="${RATING_CONFIG[ratingType].label}"]:visible`,
  );
}
