import { assertEquals } from "jsr:@std/assert@1";
import type { SoundCloudUser } from "./soundcloud-api/schemas.ts";
import type { SpotifyArtist } from "./spotify-api/schemas.ts";
import {
  normalizeSoundCloudSearchResult,
  normalizeSpotifySearchResult,
} from "./normalize.ts";

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
      description: "A test artist bio.",
    };

    const result = normalizeSoundCloudSearchResult(user);

    assertEquals(result.name, "Test Artist");
    assertEquals(result.url, "https://soundcloud.com/testartist");
    assertEquals(result.imageUrl, "https://example.com/avatar.jpg");
    assertEquals(result.description, "A test artist bio.");
    assertEquals(result.followers, 1500);
    assertEquals(result.genres, []);
  },
);

Deno.test(
  "normalizeSoundCloudSearchResult strips tracking query params from permalink_url",
  () => {
    const user: SoundCloudUser = {
      id: 12345,
      username: "testartist",
      permalink_url:
        "https://soundcloud.com/testartist?utm_medium=api&utm_campaign=social_sharing&utm_source=id_318328",
    };

    const result = normalizeSoundCloudSearchResult(user);

    assertEquals(result.url, "https://soundcloud.com/testartist");
  },
);

Deno.test("normalizeSoundCloudSearchResult handles missing description", () => {
  const user: SoundCloudUser = {
    id: 12345,
    username: "testartist",
    permalink_url: "https://soundcloud.com/testartist",
  };

  const result = normalizeSoundCloudSearchResult(user);

  assertEquals(result.description, null);
});

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

Deno.test(
  "normalizeSpotifySearchResult converts Spotify artist to Candidate",
  () => {
    const artist: SpotifyArtist = {
      id: "123abc",
      name: "Test Artist",
      genres: ["pop", "rock"],
      followers: { total: 1500 },
      images: [{ url: "https://example.com/image.jpg" }],
      external_urls: { spotify: "https://open.spotify.com/artist/123abc" },
    };

    const result = normalizeSpotifySearchResult(artist);

    assertEquals(result.name, "Test Artist");
    assertEquals(result.url, "https://open.spotify.com/artist/123abc");
    assertEquals(result.imageUrl, "https://example.com/image.jpg");
    assertEquals(result.followers, 1500);
    assertEquals(result.genres, ["pop", "rock"]);
  },
);

Deno.test("normalizeSpotifySearchResult handles missing images", () => {
  const artist: SpotifyArtist = {
    id: "456def",
    name: "Artist Without Image",
    external_urls: { spotify: "https://open.spotify.com/artist/456def" },
  };

  const result = normalizeSpotifySearchResult(artist);

  assertEquals(result.imageUrl, null);
});

Deno.test("normalizeSpotifySearchResult handles empty images array", () => {
  const artist: SpotifyArtist = {
    id: "789ghi",
    name: "Artist With Empty Images",
    images: [],
    external_urls: { spotify: "https://open.spotify.com/artist/789ghi" },
  };

  const result = normalizeSpotifySearchResult(artist);

  assertEquals(result.imageUrl, null);
});

Deno.test("normalizeSpotifySearchResult handles missing followers", () => {
  const artist: SpotifyArtist = {
    id: "101112",
    name: "Artist Without Followers",
    images: [{ url: "https://example.com/art.jpg" }],
    external_urls: { spotify: "https://open.spotify.com/artist/101112" },
  };

  const result = normalizeSpotifySearchResult(artist);

  assertEquals(result.followers, null);
});

Deno.test("normalizeSpotifySearchResult preserves followers count of 0", () => {
  const artist: SpotifyArtist = {
    id: "131415",
    name: "New Artist",
    followers: { total: 0 },
    external_urls: { spotify: "https://open.spotify.com/artist/131415" },
  };

  const result = normalizeSpotifySearchResult(artist);

  assertEquals(result.followers, 0);
});

Deno.test("normalizeSpotifySearchResult handles missing genres", () => {
  const artist: SpotifyArtist = {
    id: "161718",
    name: "Artist Without Genres",
    followers: { total: 500 },
    external_urls: { spotify: "https://open.spotify.com/artist/161718" },
  };

  const result = normalizeSpotifySearchResult(artist);

  assertEquals(result.genres, []);
});
