import { describe, it, expect } from "vitest";
import {
  validateProviderUrl,
  extractProviderIdFromUrl,
} from "./validateProviderUrl";

describe("validateProviderUrl", () => {
  describe("Spotify URLs", () => {
    it("accepts valid Spotify artist URLs", () => {
      expect(
        validateProviderUrl(
          "spotify",
          "https://open.spotify.com/artist/abc123",
        ),
      ).toBe(true);
      expect(
        validateProviderUrl(
          "spotify",
          "https://open.spotify.com/artist/xyz789",
        ),
      ).toBe(true);
    });

    it("accepts Spotify URLs with query parameters", () => {
      expect(
        validateProviderUrl(
          "spotify",
          "https://open.spotify.com/artist/abc123?utm_source=test",
        ),
      ).toBe(true);
    });

    it("rejects Spotify URLs with wrong domain", () => {
      expect(
        validateProviderUrl("spotify", "https://spotify.com/artist/abc123"),
      ).toBe(false);
      expect(
        validateProviderUrl("spotify", "https://wrong.com/artist/abc123"),
      ).toBe(false);
    });

    it("rejects Spotify URLs with wrong path shape", () => {
      expect(
        validateProviderUrl("spotify", "https://open.spotify.com/track/abc123"),
      ).toBe(false);
      expect(
        validateProviderUrl("spotify", "https://open.spotify.com/album/abc123"),
      ).toBe(false);
      expect(validateProviderUrl("spotify", "https://open.spotify.com/")).toBe(
        false,
      );
    });

    it("rejects empty and whitespace Spotify URLs", () => {
      expect(validateProviderUrl("spotify", "")).toBe(false);
      expect(validateProviderUrl("spotify", "   ")).toBe(false);
    });

    it("rejects invalid URLs", () => {
      expect(validateProviderUrl("spotify", "not a url")).toBe(false);
    });
  });

  describe("SoundCloud URLs", () => {
    it("accepts valid SoundCloud artist URLs", () => {
      expect(
        validateProviderUrl("soundcloud", "https://soundcloud.com/artist-name"),
      ).toBe(true);
      expect(
        validateProviderUrl(
          "soundcloud",
          "https://soundcloud.com/another-artist",
        ),
      ).toBe(true);
    });

    it("rejects SoundCloud URLs with wrong domain", () => {
      expect(
        validateProviderUrl("soundcloud", "https://soundcloud.net/artist-name"),
      ).toBe(false);
      expect(
        validateProviderUrl("soundcloud", "https://wrong.com/artist-name"),
      ).toBe(false);
    });

    it("rejects SoundCloud URLs with trailing slash", () => {
      expect(
        validateProviderUrl(
          "soundcloud",
          "https://soundcloud.com/artist-name/",
        ),
      ).toBe(false);
    });

    it("rejects empty and whitespace SoundCloud URLs", () => {
      expect(validateProviderUrl("soundcloud", "")).toBe(false);
      expect(validateProviderUrl("soundcloud", "   ")).toBe(false);
    });

    it("rejects invalid URLs", () => {
      expect(validateProviderUrl("soundcloud", "not a url")).toBe(false);
    });
  });
});

describe("extractProviderIdFromUrl", () => {
  it("extracts Spotify artist ID", () => {
    expect(
      extractProviderIdFromUrl(
        "spotify",
        "https://open.spotify.com/artist/abc123",
      ),
    ).toBe("abc123");
    expect(
      extractProviderIdFromUrl(
        "spotify",
        "https://open.spotify.com/artist/xyz789",
      ),
    ).toBe("xyz789");
  });

  it("extracts Spotify artist ID with query parameters", () => {
    expect(
      extractProviderIdFromUrl(
        "spotify",
        "https://open.spotify.com/artist/abc123?utm_source=test",
      ),
    ).toBe("abc123");
  });

  it("returns SoundCloud URL as-is", () => {
    expect(
      extractProviderIdFromUrl(
        "soundcloud",
        "https://soundcloud.com/artist-name",
      ),
    ).toBe("https://soundcloud.com/artist-name");
  });

  it("returns null for invalid URLs", () => {
    expect(
      extractProviderIdFromUrl("spotify", "https://spotify.com/artist/abc123"),
    ).toBeNull();
    expect(
      extractProviderIdFromUrl(
        "spotify",
        "https://open.spotify.com/track/abc123",
      ),
    ).toBeNull();
    expect(extractProviderIdFromUrl("spotify", "invalid url")).toBeNull();
  });
});
