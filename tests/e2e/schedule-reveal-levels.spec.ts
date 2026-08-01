import { test, expect } from "@playwright/test";

// Seeded in supabase/seed.sql: festival slug "reveal-test", four editions -
// one per schedule_reveal_level - each read-only so parallel workers never
// race on a shared mutable row.
const PATHS: Record<"draft" | "days" | "stages" | "full", string> = {
  draft: "/festivals/reveal-test/editions/draft/schedule/timeline",
  days: "/festivals/reveal-test/editions/days/schedule/timeline",
  stages: "/festivals/reveal-test/editions/stages/schedule/timeline",
  full: "/festivals/reveal-test/editions/full/schedule/timeline",
};

test.describe("Schedule reveal levels", () => {
  test("draft shows the not-revealed placeholder and no sets", async ({
    page,
  }) => {
    await page.goto(PATHS.draft);
    await expect(page.getByText("Schedule not yet published.")).toBeVisible();
    await expect(page.getByText("Fixture Set")).toHaveCount(0);
  });

  test("days shows the set without a stage grouping and no Timeline/List nav", async ({
    page,
  }) => {
    await page.goto(PATHS.days);
    await expect(page.getByText("Fixture Set Days")).toBeVisible();
    await expect(page.getByText("Fixture Stage")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Timeline" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "List" })).toHaveCount(0);
  });

  test("stages shows the set grouped under its stage and no Timeline/List nav", async ({
    page,
  }) => {
    await page.goto(PATHS.stages);
    await expect(page.getByText("Fixture Stage")).toBeVisible();
    await expect(page.getByText("Fixture Set Stages")).toBeVisible();
    await expect(page.getByRole("link", { name: "Timeline" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "List" })).toHaveCount(0);
  });

  test("full shows the normal timeline with the Timeline/List nav", async ({
    page,
  }) => {
    await page.goto(PATHS.full);
    await expect(page.getByTestId("timeline-scroll-container")).toBeVisible();
    await expect(page.getByRole("link", { name: "Timeline" })).toBeVisible();
    await expect(page.getByRole("link", { name: "List" })).toBeVisible();
  });
});
