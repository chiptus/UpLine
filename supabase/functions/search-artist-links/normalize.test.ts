import { assertEquals } from "jsr:@std/assert@1";
import type { SoundCloudUser } from "../_shared/soundcloud-api/schemas.ts";
import { normalizeSoundCloudSearchResult } from "./normalize.ts";

Deno.test(
  "normalizeSoundCloudSearchResult converts SoundCloud user to Candidate",
  () => {
    const user: SoundCloudUser = {
      id: 12345,
      username: "testartist",
      permalink_url: "https://soundcloud.com/testartist",
      avatar_url: "https://example.com/avatar.jpg",
      followers_count: 1500,
      display_name: "Test Artist",
    };

    const result = normalizeSoundCloudSearchResult(user);

    assertEquals(result.name, "Test Artist");
    assertEquals(result.url, "https://soundcloud.com/testartist");
    assertEquals(result.imageUrl, "https://example.com/avatar.jpg");
    assertEquals(result.followers, 1500);
    assertEquals(result.genres, []);
  },
);

Deno.test(
  "normalizeSoundCloudSearchResult uses username when display_name is null",
  () => {
    const user: SoundCloudUser = {
      id: 12345,
      username: "testartist",
      permalink_url: "https://soundcloud.com/testartist",
      display_name: null,
    };

    const result = normalizeSoundCloudSearchResult(user);

    assertEquals(result.name, "testartist");
  },
);

Deno.test("normalizeSoundCloudSearchResult handles missing avatar_url", () => {
  const user: SoundCloudUser = {
    id: 12345,
    username: "testartist",
    permalink_url: "https://soundcloud.com/testartist",
    avatar_url: null,
  };

  const result = normalizeSoundCloudSearchResult(user);

  assertEquals(result.imageUrl, null);
});

Deno.test(
  "normalizeSoundCloudSearchResult handles missing followers_count",
  () => {
    const user: SoundCloudUser = {
      id: 12345,
      username: "testartist",
      permalink_url: "https://soundcloud.com/testartist",
    };

    const result = normalizeSoundCloudSearchResult(user);

    assertEquals(result.followers, null);
  },
);

Deno.test(
  "normalizeSoundCloudSearchResult preserves a followers_count of 0",
  () => {
    const user: SoundCloudUser = {
      id: 12345,
      username: "testartist",
      permalink_url: "https://soundcloud.com/testartist",
      followers_count: 0,
    };

    const result = normalizeSoundCloudSearchResult(user);

    assertEquals(result.followers, 0);
  },
);

Deno.test(
  "normalizeSoundCloudSearchResult handles user with all optional fields",
  () => {
    const user: SoundCloudUser = {
      id: 67890,
      username: "anotherartist",
      permalink_url: "https://soundcloud.com/anotherartist",
      full_name: "Another Artist Full Name",
      display_name: "Another Artist",
      followers_count: 5000,
      avatar_url: "https://example.com/another.jpg",
    };

    const result = normalizeSoundCloudSearchResult(user);

    assertEquals(result.name, "Another Artist");
    assertEquals(result.url, "https://soundcloud.com/anotherartist");
    assertEquals(result.imageUrl, "https://example.com/another.jpg");
    assertEquals(result.followers, 5000);
  },
);
