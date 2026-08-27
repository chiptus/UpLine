import { test, expect, type Page } from "@playwright/test";
import { signInAsAdmin } from "../utils/login";
import {
  createLinkWizardTestArtist,
  deleteLinkWizardTestArtist,
  type LinkWizardTestArtist,
} from "../utils/linkWizardArtist";

const LINK_WIZARD_PATH = "/admin/festivals/test/editions/2025/links";

// Deliberately NOT in descending-follower order — the app's own sort is
// what's under test, so the mocked API response must not already be sorted
// for the DOM-order assertions below to be a real regression guard.
const MOCK_CANDIDATES = [
  {
    name: "Test Artist Indie",
    url: "https://open.spotify.com/artist/test-indie",
    imageUrl: "https://example.com/image-indie.jpg",
    description: "Independent artist focused on experimental sounds",
    followers: 50000,
    genres: ["Ambient"],
  },
  {
    name: "Test Artist Pro",
    url: "https://open.spotify.com/artist/test-pro",
    imageUrl: "https://example.com/image-pro.jpg",
    description: "Professional artist with extensive touring history",
    followers: 500000,
    genres: ["Electronic", "Techno"],
  },
  {
    name: "Test Artist Micro",
    url: "https://open.spotify.com/artist/test-micro",
    imageUrl: null,
    description: null,
    followers: 5000,
    genres: [],
  },
  {
    name: "Test Artist Rising",
    url: "https://open.spotify.com/artist/test-rising",
    imageUrl: "https://example.com/image-rising.jpg",
    description:
      "Rising talent known for innovative production techniques and live performances",
    followers: 150000,
    genres: ["House", "Deep House"],
  },
  {
    name: "Test Artist Niche",
    url: "https://open.spotify.com/artist/test-niche",
    imageUrl: "https://example.com/image-niche.jpg",
    description: null,
    followers: 25000,
    genres: ["Downtempo"],
  },
];

test.describe(
  "Link Wizard: candidate verification flow",
  { tag: "@smoke" },
  () => {
    // Each test gets its own dedicated seeded artist + set (rather than
    // sharing one fixed seeded row), so tests never race each other across
    // parallel workers or browser projects — no shared mutable state.
    let testArtist: LinkWizardTestArtist;

    test.beforeEach(async ({ page }) => {
      testArtist = await createLinkWizardTestArtist();

      await signInAsAdmin(page);
      await mockSearchArtistLinks(page, {
        [testArtist.artistName]: MOCK_CANDIDATES,
      });

      await page.goto(LINK_WIZARD_PATH);
      await expect(
        page.getByRole("heading", { name: /link wizard/i }),
      ).toBeVisible({ timeout: 15000 });

      await selectArtistByName(page, testArtist.artistName);
    });

    test.afterEach(async () => {
      await deleteLinkWizardTestArtist(testArtist);
    });

    test("completes the full happy-path flow: set info → sort → link-out → show more → select → save", async ({
      page,
      context,
    }) => {
      // Default 30s test timeout was being exceeded by the up-to-30s save
      // wait stacked on top of sign-in, navigation, and several UI interactions
      // earlier in this test.
      test.setTimeout(60000);

      // 1. Set-info panel shows the artist's actual set details, including
      // the formatted time range and the (fixture-driven) co-performers state.
      const setInfoPanel = page.getByRole("region", {
        name: new RegExp(`${testArtist.artistName} - Festival Set`, "i"),
      });
      await expect(setInfoPanel).toBeVisible();
      await expect(
        setInfoPanel.getByRole("heading", {
          name: testArtist.artistName,
          exact: true,
        }),
      ).toBeVisible();
      await expect(setInfoPanel.getByText("Club Stage")).toBeVisible();
      await expect(
        setInfoPanel.getByText(testArtist.setDescription),
      ).toBeVisible();
      // Rendered in the browser's local timezone (no explicit TZ passed to
      // formatTimeOnly), so assert the shape rather than an exact value.
      await expect(
        setInfoPanel.getByText(/\d{2}:\d{2} - \d{2}:\d{2}/),
      ).toBeVisible();
      // The fixture's set has exactly one set_artists row (the artist
      // itself), so the co-performers section renders and, once it's
      // filtered out, shows this empty state.
      await expect(
        setInfoPanel.getByText("No other co-performers"),
      ).toBeVisible();

      // 2. Candidates render sorted by descending followers; only 3 show initially.
      await expect(page.getByText("Spotify Candidates")).toBeVisible();
      await failOnCandidatesError(page);

      const candidateCards = page
        .getByRole("list", { name: "Spotify Candidates" })
        .getByRole("listitem");
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
      const spotifyUrlInput = page.getByLabel("Spotify URL");
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
        "https://open.spotify.com/artist/test-rising",
      );

      // 6. Save completes the mutation and moves past this artist. The
      // success toast (via Radix's default ~5s auto-dismiss) is too
      // transient to reliably race against under CI load — a test-side
      // wait can easily start polling after it's already gone even though
      // the save genuinely succeeded. Assert on the actual PATCH response
      // instead, which is the real signal the mutation succeeded.
      const [patchResponse] = await Promise.all([
        page.waitForResponse(
          (response) => {
            if (
              response.request().method() !== "PATCH" ||
              !response.url().includes("/rest/v1/artists") ||
              !response.url().includes(testArtist.artistId)
            ) {
              return false;
            }
            const body = response.request().postDataJSON();
            return body?.spotify_url === MOCK_CANDIDATES[3].url;
          },
          { timeout: 30000 },
        ),
        page.getByRole("button", { name: /save & next/i }).click(),
      ]);
      expect(patchResponse.ok()).toBe(true);
    });

    test("validates that link-out click does NOT select the candidate (regression guard)", async ({
      page,
      context,
    }) => {
      await expect(page.getByText("Spotify Candidates")).toBeVisible();
      await failOnCandidatesError(page);

      const spotifyUrlInput = page.getByLabel("Spotify URL");
      await expect(spotifyUrlInput).toHaveValue("");

      const candidateCard = page
        .getByRole("list", { name: "Spotify Candidates" })
        .getByRole("listitem")
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

// search-artist-links is invoked cross-origin (app on :8080, Supabase on
// :54321), so the browser sends a CORS preflight OPTIONS request before the
// real POST. That must be answered separately from the mocked JSON response.
async function mockSearchArtistLinks(
  page: Page,
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
async function failOnCandidatesError(page: Page) {
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

async function selectArtistByName(page: Page, name: string) {
  await page
    .getByRole("listitem")
    .filter({ hasText: name })
    .getByRole("button", { name })
    .click();
  await expect(
    page.getByRole("heading", {
      name: new RegExp(`link wizard.*${name}`, "i"),
    }),
  ).toBeVisible();
}
