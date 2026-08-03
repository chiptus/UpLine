import { test, expect, type Locator, type Page } from "@playwright/test";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025".
const TIMELINE_PATH = "/festivals/test/editions/2025/schedule/timeline";

async function openTimeline(page: Page) {
  await page.goto(TIMELINE_PATH);

  const scrollContainer = page.getByTestId("timeline-scroll-container");
  await expect(scrollContainer).toBeVisible({ timeout: 15000 });

  return scrollContainer;
}

// The set link with the largest horizontal overlap with the visible strip.
// On phone viewports no card fits fully inside the narrow viewport
async function findSetLinkInView(scrollContainer: Locator) {
  const containerBox = await scrollContainer.boundingBox();
  if (!containerBox) throw new Error("scroll container has no bounding box");

  const links = scrollContainer.getByRole("link");
  const count = await links.count();
  let best: { link: Locator; overlap: number } | null = null;
  for (let i = 0; i < count; i++) {
    const box = await links.nth(i).boundingBox();
    if (!box) continue;
    const overlap =
      Math.min(box.x + box.width, containerBox.x + containerBox.width) -
      Math.max(box.x, containerBox.x);
    if (overlap > 0 && (!best || overlap > best.overlap)) {
      best = { link: links.nth(i), overlap };
    }
  }
  if (!best) {
    throw new Error("no set link overlapping the visible timeline viewport");
  }
  return best.link;
}

// Waits until the debounced scrollTo URL write has settled: the value must
// survive a full debounce window (300ms) unchanged.
async function waitForScrollToToSettle(page: Page) {
  await expect
    .poll(
      async () => {
        const before = new URL(page.url()).searchParams.get("scrollTo");
        await page.waitForTimeout(400);
        return before === new URL(page.url()).searchParams.get("scrollTo");
      },
      { timeout: 15000 },
    )
    .toBe(true);
}

test.describe(
  "Timeline scroll position (scrollTo URL state)",
  { tag: "@smoke" },
  () => {
    test("untouched timeline has no scrollTo in the URL", async ({ page }) => {
      await openTimeline(page);

      expect(new URL(page.url()).searchParams.has("scrollTo")).toBe(false);
    });

    test("scrolling writes a debounced, rounded scrollTo via history replace", async ({
      page,
    }) => {
      const scrollContainer = await openTimeline(page);

      const historyLengthBeforeScroll = await page.evaluate(
        () => window.history.length,
      );

      await scrollContainer.evaluate((el) => {
        el.scrollLeft = el.scrollLeft + 400;
      });

      await expect(page).toHaveURL(/scrollTo=/);

      const scrollTo = new URL(page.url()).searchParams.get("scrollTo");
      expect(scrollTo).toBeTruthy();
      expect(new Date(scrollTo as string).toString()).not.toBe("Invalid Date");
      // Rounded to 5-minute granularity.
      expect(new Date(scrollTo as string).getMinutes() % 5).toBe(0);

      // History replace, not push: writing scrollTo must not grow the
      // history stack, even across multiple debounced writes.
      await scrollContainer.evaluate((el) => {
        el.scrollLeft = el.scrollLeft + 200;
      });
      await expect
        .poll(() => new URL(page.url()).searchParams.get("scrollTo"))
        .not.toBe(scrollTo);

      const historyLengthAfterScroll = await page.evaluate(
        () => window.history.length,
      );
      expect(historyLengthAfterScroll).toBe(historyLengthBeforeScroll);
    });

    test("opening a URL with scrollTo centers the viewport on that moment", async ({
      page,
    }) => {
      const scrollContainer = await openTimeline(page);

      // Scroll to discover a real, in-range moment to jump back to.
      await scrollContainer.evaluate((el) => {
        el.scrollLeft = el.scrollLeft + 600;
      });
      await expect
        .poll(() => new URL(page.url()).searchParams.has("scrollTo"))
        .toBe(true);

      const scrollTo = new URL(page.url()).searchParams.get("scrollTo");
      expect(scrollTo).toBeTruthy();
      const scrollLeftAfterScroll = await scrollContainer.evaluate(
        (el) => el.scrollLeft,
      );

      // Reset by navigating away, then open the URL with scrollTo directly.
      await page.goto(
        `${TIMELINE_PATH}?scrollTo=${encodeURIComponent(scrollTo as string)}`,
      );
      const reloadedContainer = page.getByTestId("timeline-scroll-container");
      await expect(reloadedContainer).toBeVisible();

      const scrollLeftOnLoad = await reloadedContainer.evaluate(
        (el) => el.scrollLeft,
      );

      // Centering is deterministic given the same viewport width, so this
      // should land close to where the debounced write captured it from.
      expect(Math.abs(scrollLeftOnLoad - scrollLeftAfterScroll)).toBeLessThan(
        10,
      );
    });

    test("back from a set detail page restores the viewport position", async ({
      page,
    }) => {
      const scrollContainer = await openTimeline(page);

      await scrollContainer.evaluate((el) => {
        el.scrollLeft = el.scrollLeft + 500;
      });
      await expect
        .poll(() => new URL(page.url()).searchParams.has("scrollTo"))
        .toBe(true);

      const setLink = await findSetLinkInView(scrollContainer);
      await setLink.scrollIntoViewIfNeeded();
      await waitForScrollToToSettle(page);

      const urlWithScroll = page.url();
      const scrollLeftBeforeNav = await scrollContainer.evaluate(
        (el) => el.scrollLeft,
      );

      await setLink.click();

      // Wait for the set-detail page to actually render before going back,
      // otherwise goBack() races the still-in-flight forward navigation and
      // can pop back to a stale/default search state.
      await expect(
        page.getByRole("button", { name: "Back to Artists" }),
      ).toBeVisible({ timeout: 20000 });
      await page.goBack();
      await expect(page).toHaveURL(urlWithScroll);

      const restoredContainer = page.getByTestId("timeline-scroll-container");
      await expect(restoredContainer).toBeVisible();
      await expect
        .poll(async () =>
          Math.abs(
            (await restoredContainer.evaluate((el) => el.scrollLeft)) -
              scrollLeftBeforeNav,
          ),
        )
        .toBeLessThan(10);
    });

    test("a full reload restores the viewport position from scrollTo", async ({
      page,
    }) => {
      const scrollContainer = await openTimeline(page);

      await scrollContainer.evaluate((el) => {
        el.scrollLeft = el.scrollLeft + 500;
      });
      await expect
        .poll(() => new URL(page.url()).searchParams.has("scrollTo"))
        .toBe(true);

      const urlWithScroll = page.url();
      expect(new URL(urlWithScroll).searchParams.has("scrollTo")).toBe(true);
      const scrollLeftBeforeReload = await scrollContainer.evaluate(
        (el) => el.scrollLeft,
      );

      // Reloading the same URL restores the viewport via mount-time centering
      // on the scrollTo param.
      await page.goto(urlWithScroll);
      const reloadedContainer = page.getByTestId("timeline-scroll-container");
      await expect(reloadedContainer).toBeVisible();
      await expect
        .poll(async () =>
          Math.abs(
            (await reloadedContainer.evaluate((el) => el.scrollLeft)) -
              scrollLeftBeforeReload,
          ),
        )
        .toBeLessThan(10);
    });
  },
);
