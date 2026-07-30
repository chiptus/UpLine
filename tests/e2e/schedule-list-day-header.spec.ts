import { test, expect, Page, Locator } from "@playwright/test";

// Seeded in supabase/seed.sql: festival slug "test", edition slug "2025",
// three festival days (Jul 12-14, 2025), stages "Main Stage" and "Club Stage".
const LIST_PATH = "/festivals/test/editions/2025/schedule/list";

test.describe("List view sticky day header", () => {
  test("stays stuck across a full day's sets and hands over to the next day", async ({
    page,
  }) => {
    await page.goto(LIST_PATH);

    const dayGroups = page
      .getByRole("region", { name: "Schedule by day" })
      .getByRole("region");
    await expect(dayGroups).toHaveCount(3);

    const firstHeading = dayGroups.nth(0).getByRole("heading", { level: 2 });
    const firstHeadingText = await firstHeading.innerText();

    // Scroll far enough that the header has left the flow and docked; where
    // it docks is the offset every day header must hold at.
    await scrollBy(page, 600);
    const dockedTop = await topOf(firstHeading);

    // Still inside the first day, so the same header must not budge.
    await scrollBy(page, 400);
    await expect.poll(() => topOf(firstHeading)).toBeCloseTo(dockedTop, 0);
    await expect(firstHeading).toHaveText(firstHeadingText);

    // Land just inside the second day: far enough that its header has docked,
    // not so far that the section's bottom edge pushes the header back out.
    const secondGroup = dayGroups.nth(1);
    await scrollBy(page, (await topOf(secondGroup)) - dockedTop + 40);

    const secondHeading = secondGroup.getByRole("heading", { level: 2 });
    await expect(secondHeading).toBeVisible();
    const secondHeadingText = await secondHeading.innerText();
    expect(secondHeadingText).not.toBe(firstHeadingText);

    // Handover: the next day's header takes over the same docked offset.
    await expect.poll(() => topOf(secondHeading)).toBeCloseTo(dockedTop, 0);
  });

  test("opens the filter sheet from the sticky day header", async ({
    page,
  }) => {
    await page.goto(LIST_PATH);

    const dayGroup = page.getByRole("region", { name: /Jul 12/ });
    const trigger = dayGroup.getByRole("button", { name: /Filters/ });
    await expect(trigger).toBeVisible();

    await trigger.click();
    await expect(page.getByTestId("schedule-filter-sheet")).toBeVisible();
  });
});

// window.scrollBy rather than mouse.wheel: mobile WebKit has no wheel.
async function scrollBy(page: Page, y: number) {
  await page.evaluate((amount) => window.scrollBy(0, amount), y);
}

function topOf(locator: Locator) {
  return locator.evaluate((el) => el.getBoundingClientRect().top);
}
