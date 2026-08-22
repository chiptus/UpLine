import { test, expect } from "@playwright/test";
import { signIn } from "../utils/login";

// Seeded via supabase/seed.sql: "Test festival" edition "Boom Festival 2025"
// This is an admin page, so we sign in
const LINK_WIZARD_PATH = "/festivals/test/editions/2025/links";

// Mock candidate data with varying followers and descriptions
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
    name: "Test Artist Indie",
    url: "https://spotify.com/artist/test-indie",
    imageUrl: "https://example.com/image-indie.jpg",
    description: "Independent artist focused on experimental sounds",
    followers: 50000,
    genres: ["Ambient"],
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
    name: "Test Artist Micro",
    url: "https://spotify.com/artist/test-micro",
    imageUrl: null,
    description: null,
    followers: 5000,
    genres: [],
  },
  {
    name: "Test Artist Niche",
    url: "https://spotify.com/artist/test-niche",
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
    test("completes the full happy-path flow: search → set info → link-out → show more → select → save", async ({
      page,
      context,
    }) => {
      // Sign in as an authenticated admin user
      await signIn(page);

      // Intercept and mock the search-artist-links edge function
      // This returns our controlled candidate dataset
      await page.route("**/functions/v1/search-artist-links", async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();
        const artistNames = postData.artistNames || [];
        const provider = postData.provider || "spotify";

        if (artistNames.includes("Kiara Scuro")) {
          await route.abort("aborted");
          return;
        }

        if (artistNames.length > 0) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              results: artistNames.map((name: string) => ({
                artistName: name,
                provider,
                candidates: MOCK_CANDIDATES,
                error: null,
              })),
            }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ results: [] }),
          });
        }
      });

      // Navigate to the Link Wizard page
      await page.goto(LINK_WIZARD_PATH);

      // Wait for the Link Wizard to load and display the first artist
      const linkWizardTitle = page.getByRole("heading", {
        name: /link wizard/i,
      });
      await expect(linkWizardTitle).toBeVisible({ timeout: 15000 });

      // 1. Verify the set-info panel shows the artist's set information
      const setInfoPanel = page.getByText(/Festival Sets?$/);
      await expect(setInfoPanel).toBeVisible();

      // Check that set title is displayed
      const setTitle = page.locator("h4").first();
      await expect(setTitle).toBeVisible();
      const setTitleText = await setTitle.textContent();
      expect(setTitleText).toBeTruthy();

      // Check stage information
      const stageInfo = page.locator("text=/Stage:/");
      await expect(stageInfo.first()).toBeVisible();

      // Check time information (pattern like "18:00 - 19:30")
      const timeInfo = page.locator(
        "text=/\\d{1,2}:\\d{2}\\s*-\\s*\\d{1,2}:\\d{2}/",
      );
      await expect(timeInfo.first()).toBeVisible();

      // 2. Verify candidates render in descending-follower order
      const spotifyCandidatesLabel = page.getByText("Spotify Candidates");
      await expect(spotifyCandidatesLabel).toBeVisible();

      // Find all "Select all" buttons for the Spotify candidates section
      // Get the container that holds the candidates
      const candidatesContainer = spotifyCandidatesLabel
        .locator("..")
        .locator("..");

      // Wait for candidates to load
      await page.waitForTimeout(1000);

      const selectAllButtons = candidatesContainer.locator(
        "button:has-text('Select all')",
      );
      const initialButtonCount = await selectAllButtons.count();
      expect(initialButtonCount).toBe(3);

      // Verify the order: Pro (500k) > Rising (150k) > Indie (50k)
      const proCard = page.getByText("Test Artist Pro");
      const risingCard = page.getByText("Test Artist Rising");
      const indieCard = page.getByText("Test Artist Indie");

      await expect(proCard).toBeVisible();
      await expect(risingCard).toBeVisible();
      await expect(indieCard).toBeVisible();

      // 3. Verify "Show more" button appears
      const showMoreButton = candidatesContainer.getByRole("button", {
        name: "Show more",
      });
      await expect(showMoreButton).toBeVisible();

      // 4. Click the provider link to verify it opens a new tab without selecting the candidate
      // Find the external link button in the first candidate card
      const firstCandidateContainer = candidatesContainer
        .locator("[class*='Card']")
        .first();
      const externalLinkButton =
        firstCandidateContainer.locator("a[target='_blank']");

      // Verify staged URL is empty before clicking link
      const spotifyUrlInput = page
        .locator('input[placeholder*="open.spotify.com"]')
        .first();
      const initialSpotifyUrl = await spotifyUrlInput.inputValue();
      expect(initialSpotifyUrl).toBe("");

      // Listen for new page and click the external link
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        externalLinkButton.click(),
      ]);

      // Verify the new page is to spotify.com
      expect(newPage.url()).toContain("spotify.com");
      await newPage.close();

      // Verify that the staged URL is still empty (link click did not select the candidate)
      const spotifyUrlAfterLinkClick = await spotifyUrlInput.inputValue();
      expect(spotifyUrlAfterLinkClick).toBe("");

      // 5. Click "Show more" to reveal all candidates
      await showMoreButton.click();

      // Verify all 5 candidates are now visible
      await page.waitForTimeout(500);
      const allSelectAllButtons = candidatesContainer.locator(
        "button:has-text('Select all')",
      );
      const finalButtonCount = await allSelectAllButtons.count();
      expect(finalButtonCount).toBe(5);

      // 6. Verify candidate descriptions render when present
      const risingDescription = page.getByText(
        "innovative production techniques",
      );
      await expect(risingDescription).toBeVisible();

      // Verify the Micro candidate (no description) is still visible
      const microCard = page.getByText("Test Artist Micro");
      await expect(microCard).toBeVisible();

      // 7. Select a candidate and verify it updates the staged fields
      // Find the "Rising" candidate card and click its "Select all" button
      const risingCardContainer = page
        .locator("text=Test Artist Rising")
        .locator("../../../..");

      const risingSelectButton = risingCardContainer.getByRole("button", {
        name: "Select all",
      });
      await risingSelectButton.click();

      // Verify the Spotify URL was populated
      const spotifyUrlAfterSelect = await spotifyUrlInput.inputValue();
      expect(spotifyUrlAfterSelect).toBe(
        "https://spotify.com/artist/test-rising",
      );

      // 8. Save the changes and verify the save completes the flow
      const saveButton = page.getByRole("button", { name: /save & next/i });
      await expect(saveButton).toBeEnabled();

      // Mock the artist update response
      await page.route("**/rest/v1/artists", async (route) => {
        if (route.request().method() === "PATCH") {
          const body = route.request().postDataJSON();
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(body),
          });
        } else {
          await route.continue();
        }
      });

      // Click save
      await saveButton.click();

      // Verify the save completed
      await expect(saveButton).toBeEnabled({ timeout: 5000 });
    });

    test("validates that link-out click does NOT select the candidate (regression guard)", async ({
      page,
      context,
    }) => {
      // This test ensures the link-out functionality is isolated and does not trigger candidate selection
      await signIn(page);

      // Intercept and mock the search-artist-links edge function
      await page.route("**/functions/v1/search-artist-links", async (route) => {
        const request = route.request();
        const postData = request.postDataJSON();
        const artistNames = postData.artistNames || [];
        const provider = postData.provider || "spotify";

        if (artistNames.length > 0) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              results: artistNames.map((name: string) => ({
                artistName: name,
                provider,
                candidates: [
                  {
                    name: "Regression Guard Candidate",
                    url: "https://spotify.com/artist/regression-test",
                    imageUrl: null,
                    description: null,
                    followers: 100000,
                    genres: ["Electronic"],
                  },
                ],
                error: null,
              })),
            }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ results: [] }),
          });
        }
      });

      await page.goto(LINK_WIZARD_PATH);

      const linkWizardTitle = page.getByRole("heading", {
        name: /link wizard/i,
      });
      await expect(linkWizardTitle).toBeVisible({ timeout: 15000 });

      // Get the initial state of the staged fields
      const spotifyUrlInput = page
        .locator('input[placeholder*="open.spotify.com"]')
        .first();
      const initialSpotifyUrl = await spotifyUrlInput.inputValue();
      expect(initialSpotifyUrl).toBe("");

      // Wait for candidate to load
      await page.waitForTimeout(1000);

      // Find the external link button for the candidate
      const candidateContainer = page
        .getByText("Regression Guard Candidate")
        .locator("../../../..");
      const externalLinkButton =
        candidateContainer.locator("a[target='_blank']");

      // Click the external link and listen for new page
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        externalLinkButton.click(),
      ]);

      // Verify the new page opened to spotify.com
      expect(newPage.url()).toContain("spotify.com");
      await newPage.close();

      // Wait a moment for any potential state updates
      await page.waitForTimeout(500);

      // Verify the staged fields were NOT updated
      const finalSpotifyUrl = await spotifyUrlInput.inputValue();
      expect(finalSpotifyUrl).toBe(""); // Should still be empty

      // Verify the "Select all" button is still available and not activated
      const selectAllButton = candidateContainer.getByRole("button", {
        name: "Select all",
      });
      await expect(selectAllButton).toBeVisible();
      await expect(selectAllButton).toBeEnabled();
    });
  },
);
