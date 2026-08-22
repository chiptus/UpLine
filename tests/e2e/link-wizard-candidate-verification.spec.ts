import { test, expect } from "@playwright/test";
import { submitOtpSignIn } from "../utils/login";
import { TEST_CONFIG } from "../config/test-env";

// Seeded via supabase/seed.sql: festival "test", edition "2025" ("Boom Festival 2025").
// Kiara Scuro is missing only her Spotify link there, so her step renders a
// single (Spotify) candidates panel.
const LINK_WIZARD_PATH = "/admin/festivals/test/editions/2025/links";
const KIARA_SET_DESCRIPTION = "Rising star in dark techno";
const KIARA_ARTIST_ID = "a3333333-3333-3333-3333-333333333333";

// The happy-path test really saves Kiara's spotify_url (no mock on the
// artists PATCH), which would make her step stop rendering a Spotify panel
// for any test that runs after it. Restore her seeded state so both tests
// stay independent of run order.
test.afterEach(async () => {
  await fetch(
    `${TEST_CONFIG.SUPABASE_URL}/rest/v1/artists?id=eq.${KIARA_ARTIST_ID}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: TEST_CONFIG.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${TEST_CONFIG.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ spotify_url: null }),
    },
  );
});

const MOCK_CANDIDATES = [
  {
    name: "Test Artist Pro",
    url: "https://spotify.com/artist/test-pro",
    imageUrl: "https://example.com/image-pro.jpg",
    description: "Professional artist with extensive touring history",
    followers: 500000,
    genres: ["Electronic", "Techno"],
  },
  {
    name: "Test Artist Rising",
    url: "https://spotify.com/artist/test-rising",
    imageUrl: "https://example.com/image-rising.jpg",
    description:
      "Rising talent known for innovative production techniques and live performances",
    followers: 150000,
    genres: ["House", "Deep House"],
  },
  {
    name: "Test Artist Indie",
    url: "https://spotify.com/artist/test-indie",
    imageUrl: "https://example.com/image-indie.jpg",
    description: "Independent artist focused on experimental sounds",
    followers: 50000,
    genres: ["Ambient"],
  },
  {
    name: "Test Artist Niche",
    url: "https://spotify.com/artist/test-niche",
    imageUrl: "https://example.com/image-niche.jpg",
    description: null,
    followers: 25000,
    genres: ["Downtempo"],
  },
  {
    name: "Test Artist Micro",
    url: "https://spotify.com/artist/test-micro",
    imageUrl: null,
    description: null,
    followers: 5000,
    genres: [],
  },
];

async function signInAsAdmin(page: import("@playwright/test").Page) {
  await submitOtpSignIn(page, TEST_CONFIG.SEEDED_ONBOARDED_USER_EMAIL);
  await expect(page.getByRole("button", { name: /user menu/i })).toBeVisible({
    timeout: 15000,
  });
}

// search-artist-links is invoked cross-origin (app on :8080, Supabase on
// :54321), so the browser sends a CORS preflight OPTIONS request before the
// real POST. That must be answered separately from the mocked JSON response.
async function mockSearchArtistLinks(
  page: import("@playwright/test").Page,
  candidatesByArtist: Record<string, typeof MOCK_CANDIDATES>,
) {
  await page.route("**/functions/v1/search-artist-links", async (route) => {
    const request = route.request();

    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 200,
        // A wildcard here does NOT cover "Authorization" per the CORS spec,
        // so it must be listed explicitly or the browser silently blocks
        // supabase-js's actual request even though this preflight "succeeds".
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type",
        },
      });
      return;
    }

    const postData = request.postDataJSON();
    const artistNames: string[] = postData.artistNames || [];
    const providers = postData.provider
      ? [postData.provider]
      : ["spotify", "soundcloud"];

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        results: artistNames.flatMap((name) =>
          providers.map((provider) => ({
            artistName: name,
            provider,
            // searchResponseSchema's "error" field is optional but does NOT
            // accept null — omitting it (rather than `error: null`) avoids
            // failing zod's .parse() and looping into query retries.
            candidates:
              provider === "spotify" ? (candidatesByArtist[name] ?? []) : [],
          })),
        ),
      }),
    });
  });
}

// Fails fast with the panel's own error text instead of a generic "not
// found" timeout, so a CI failure is actionable without downloading traces.
async function failOnCandidatesError(page: import("@playwright/test").Page) {
  const errorAlert = page.getByRole("alert");
  const appeared = await errorAlert
    .waitFor({ state: "visible", timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  if (appeared) {
    const errorText = await errorAlert.textContent();
    throw new Error(`Candidates panel shows an error: ${errorText}`);
  }
}

async function selectArtistByName(
  page: import("@playwright/test").Page,
  name: string,
) {
  await page
    .getByRole("row")
    .filter({ hasText: name })
    .getByRole("button", { name })
    .click();
  await expect(
    page.getByRole("heading", {
      name: new RegExp(`link wizard.*${name}`, "i"),
    }),
  ).toBeVisible();
}

test.describe(
  "Link Wizard: candidate verification flow",
  { tag: "@smoke" },
  () => {
    test("completes the full happy-path flow: set info → sort → link-out → show more → select → save", async ({
      page,
      context,
    }) => {
      // Default 30s test timeout was being exceeded by the up-to-20s save-toast
      // wait stacked on top of sign-in, navigation, and several UI interactions
      // earlier in this test — the test was killed mid-wait, before it could
      // ever observe which toast (if any) appeared.
      test.setTimeout(60000);

      await signInAsAdmin(page);
      await mockSearchArtistLinks(page, { "Kiara Scuro": MOCK_CANDIDATES });

      await page.goto(LINK_WIZARD_PATH);
      await expect(
        page.getByRole("heading", { name: /link wizard/i }),
      ).toBeVisible({ timeout: 15000 });

      await selectArtistByName(page, "Kiara Scuro");

      // 1. Set-info panel shows the artist's actual set details. Scoped to the
      // set-info Card itself: the artist's own description happens to equal
      // the set description in the seed data, and also appears (editable) in
      // the "Staged" description textarea further down the page.
      const setInfoPanel = page.locator(".bg-slate-50").filter({
        hasText: "Kiara Scuro - Festival Set",
      });
      await expect(setInfoPanel).toBeVisible();
      await expect(setInfoPanel.getByText("Club Stage")).toBeVisible();
      await expect(setInfoPanel.getByText(KIARA_SET_DESCRIPTION)).toBeVisible();

      // 2. Candidates render sorted by descending followers; only 3 show initially.
      await expect(page.getByText("Spotify Candidates")).toBeVisible();
      await failOnCandidatesError(page);

      // ".bg-card.p-3" (not just ".bg-card") because the wizard's own outer
      // Card wraps everything below it, including the candidate cards, so a
      // plain ".bg-card" filtered by descendant text/content also matches
      // that ancestor.
      const candidateCards = page.locator(".bg-card.p-3");
      await expect(candidateCards.first()).toBeVisible({ timeout: 15000 });
      await expect(candidateCards).toHaveCount(3);
      await expect(candidateCards.nth(0)).toContainText("Test Artist Pro");
      await expect(candidateCards.nth(1)).toContainText("Test Artist Rising");
      await expect(candidateCards.nth(2)).toContainText("Test Artist Indie");

      // Description renders when present.
      await expect(
        page.getByText("innovative production techniques"),
      ).toBeVisible();

      // 3. Provider link opens a new tab and does NOT stage/select the candidate.
      const spotifyUrlInput = page.locator(
        'input[placeholder*="open.spotify.com"]',
      );
      await expect(spotifyUrlInput).toHaveValue("");

      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        candidateCards
          .nth(0)
          .getByRole("link", { name: /view.*provider profile/i })
          .click(),
      ]);
      await expect(newPage).toHaveURL(/spotify\.com/);
      await newPage.close();
      await expect(spotifyUrlInput).toHaveValue("");

      // 4. "Show more" reveals all 5 candidates, including one without a description.
      await page.getByRole("button", { name: "Show more" }).click();
      await expect(candidateCards).toHaveCount(5);
      await expect(page.getByText("Test Artist Micro")).toBeVisible();

      // 5. Selecting a candidate stages its URL.
      await candidateCards
        .filter({ hasText: "Test Artist Rising" })
        .getByRole("button", { name: "Select all" })
        .click();
      await expect(spotifyUrlInput).toHaveValue(
        "https://spotify.com/artist/test-rising",
      );

      // 6. Save completes the mutation and moves past this artist.
      await page.getByRole("button", { name: /save & next/i }).click();

      const successToast = page.getByText("Artist updated successfully");
      const anyToast = page.locator('[role="status"], [role="alert"]');
      const appeared = await Promise.race([
        successToast
          .waitFor({ state: "visible", timeout: 20000 })
          .then(() => "success" as const),
        anyToast
          .waitFor({ state: "visible", timeout: 20000 })
          .then(() => "other" as const),
      ]).catch(() => "none" as const);

      if (appeared !== "success") {
        const toastText = await anyToast
          .first()
          .textContent()
          .catch(() => null);
        throw new Error(
          `Expected the "Artist updated successfully" toast; got ${appeared} (text: ${toastText ?? "no toast found"})`,
        );
      }
    });

    test("validates that link-out click does NOT select the candidate (regression guard)", async ({
      page,
      context,
    }) => {
      await signInAsAdmin(page);
      await mockSearchArtistLinks(page, { "Kiara Scuro": MOCK_CANDIDATES });

      await page.goto(LINK_WIZARD_PATH);
      await expect(
        page.getByRole("heading", { name: /link wizard/i }),
      ).toBeVisible({ timeout: 15000 });

      await selectArtistByName(page, "Kiara Scuro");

      await expect(page.getByText("Spotify Candidates")).toBeVisible();
      await failOnCandidatesError(page);

      const spotifyUrlInput = page.locator(
        'input[placeholder*="open.spotify.com"]',
      );
      await expect(spotifyUrlInput).toHaveValue("");

      const candidateCard = page
        .locator(".bg-card.p-3")
        .filter({ hasText: "Test Artist Pro" });
      await expect(candidateCard).toBeVisible({ timeout: 15000 });

      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        candidateCard
          .getByRole("link", { name: /view.*provider profile/i })
          .click(),
      ]);
      await expect(newPage).toHaveURL(/spotify\.com/);
      await newPage.close();

      await expect(spotifyUrlInput).toHaveValue("");
      await expect(
        candidateCard.getByRole("button", { name: "Select all" }),
      ).toBeEnabled();
    });
  },
);
