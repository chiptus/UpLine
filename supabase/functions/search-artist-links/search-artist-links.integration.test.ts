// Integration tests for search-artist-links edge function.
// Tests the full request path with mocked Spotify API responses.
// Run with: deno test --allow-env search-artist-links.integration.test.ts

import { assertEquals, assertExists } from "jsr:@std/assert@1";
import { resetSpotifyTokenCacheForTests } from "../_shared/spotify-api/auth.ts";

Deno.env.set("SPOTIFY_CLIENT_ID", "test-client-id");
Deno.env.set("SPOTIFY_CLIENT_SECRET", "test-client-secret");

let mockFetchCallCount = 0;
let mockFetchResponses: Array<{
  status: number;
  headers?: Record<string, string>;
}> = [];

async function setupMockFetch(
  responses: Array<{ status: number; headers?: Record<string, string> }>,
) {
  mockFetchCallCount = 0;
  mockFetchResponses = responses;
  resetSpotifyTokenCacheForTests();

  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (url: string, _options?: RequestInit) => {
    if (mockFetchCallCount >= mockFetchResponses.length) {
      throw new Error(
        `Mock fetch called ${mockFetchCallCount + 1} times, but only ${mockFetchResponses.length} responses configured`,
      );
    }

    const response = mockFetchResponses[mockFetchCallCount];
    mockFetchCallCount++;

    const headers = new Headers(response.headers ?? {});

    if (response.status === 429) {
      return new Response(null, {
        status: 429,
        headers,
      });
    }

    if (response.status === 200) {
      if (url.includes("/search")) {
        const mockSearchResponse = {
          artists: {
            items: [
              {
                id: "test-artist-id",
                name: "Test Artist",
                genres: ["rock", "pop"],
                followers: { total: 1000 },
                images: [{ url: "https://example.com/image.jpg" }],
                external_urls: {
                  spotify: "https://open.spotify.com/artist/test-id",
                },
              },
            ],
          },
        };
        return new Response(JSON.stringify(mockSearchResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/token")) {
        const mockTokenResponse = {
          access_token: "mock-token-12345",
          token_type: "Bearer",
          expires_in: 3600,
        };
        return new Response(JSON.stringify(mockTokenResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(null, { status: response.status, headers });
  }) as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

Deno.test(
  "search-artist-links: repeated 429s exhaust retries and surface rate-limit error",
  async function searchArtistLinksRateLimitExhausted() {
    const cleanup = await setupMockFetch([
      { status: 200 },
      { status: 429, headers: { "Retry-After": "30" } },
      { status: 429, headers: { "Retry-After": "30" } },
      { status: 429, headers: { "Retry-After": "30" } },
    ]);

    try {
      const { searchSpotify } = await import("./spotify-adapter.ts");
      const result = await searchSpotify(["Test Artist"]);

      assertEquals(result.has("Test Artist"), true, "Result has artist key");
      const artistResult = result.get("Test Artist");
      assertExists(artistResult, "Artist result exists");
      assertEquals(
        artistResult.candidates.length,
        0,
        "No candidates due to rate limit",
      );
      assertEquals(
        artistResult.error,
        "Spotify rate limited",
        "Error indicates rate limit",
      );
      assertEquals(
        artistResult.rateLimitRetryAfter,
        30,
        "Rate limit wait time is 30 seconds",
      );
    } finally {
      cleanup();
    }
  },
);

Deno.test(
  "search-artist-links: 429 followed by success recovers with backoff",
  async function searchArtistLinksRateLimitRecovery() {
    const cleanup = await setupMockFetch([
      { status: 200 },
      { status: 429, headers: { "Retry-After": "1" } },
      { status: 200 },
    ]);

    try {
      const { searchSpotify } = await import("./spotify-adapter.ts");
      const result = await searchSpotify(["Test Artist"]);

      assertEquals(result.has("Test Artist"), true, "Result has artist key");
      const artistResult = result.get("Test Artist");
      assertExists(artistResult, "Artist result exists");
      assertEquals(
        artistResult.candidates.length,
        1,
        "Candidates returned after recovery",
      );
      assertEquals(
        artistResult.candidates[0].name,
        "Test Artist",
        "Artist name in candidate",
      );
      assertEquals(artistResult.error, undefined, "No error after recovery");
      assertEquals(
        artistResult.rateLimitRetryAfter,
        undefined,
        "No rate limit wait time",
      );
    } finally {
      cleanup();
    }
  },
);

Deno.test(
  "search-artist-links: non-429 errors fail immediately without retry",
  async function searchArtistLinksNon429Failure() {
    const cleanup = await setupMockFetch([{ status: 200 }, { status: 500 }]);

    try {
      const { searchSpotify } = await import("./spotify-adapter.ts");
      const result = await searchSpotify(["Test Artist"]);

      assertEquals(result.has("Test Artist"), true, "Result has artist key");
      const artistResult = result.get("Test Artist");
      assertExists(artistResult, "Artist result exists");
      assertEquals(
        artistResult.error,
        "Spotify search failed",
        "Error indicates search failure",
      );
      assertEquals(
        artistResult.rateLimitRetryAfter,
        undefined,
        "No rate limit wait time for non-429",
      );
      assertEquals(
        mockFetchCallCount,
        2,
        "Only two fetch attempts: token + one search",
      );
    } finally {
      cleanup();
    }
  },
);
