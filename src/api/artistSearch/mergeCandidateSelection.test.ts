import { describe, expect, it } from "vitest";
import {
  mergeCandidateSelection,
  type MergeContext,
} from "./mergeCandidateSelection";
import type { Candidate } from "./types";
import type { Artist } from "@/api/artists/types";

function makeArtist(overrides: Partial<Artist> & { id: string }): Artist {
  return {
    name: overrides.name ?? overrides.id,
    slug: overrides.slug ?? overrides.id,
    description: null,
    estimated_date: null,
    image_url: null,
    spotify_url: null,
    soundcloud_url: null,
    stage: null,
    time_start: null,
    time_end: null,
    archived: false,
    added_by: "user-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    artist_music_genres: [],
    ...overrides,
  };
}

function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    name: "Test Artist",
    url: "https://spotify.com/artist/123",
    imageUrl: "https://example.com/image.jpg",
    followers: 1000,
    genres: ["rock", "pop"],
    ...overrides,
  };
}

describe("mergeCandidateSelection", () => {
  it("always sets the provider URL field", () => {
    const artist = makeArtist({ id: "a1" });
    const candidate = makeCandidate();
    const context: MergeContext = {
      artist,
      stagedUpdates: {},
    };

    const update = mergeCandidateSelection(context, candidate, "spotify");

    expect(update.spotify_url).toBe(candidate.url);
  });

  it("sets soundcloud URL for soundcloud provider", () => {
    const artist = makeArtist({ id: "a1" });
    const candidate = makeCandidate({
      url: "https://soundcloud.com/artist",
    });
    const context: MergeContext = {
      artist,
      stagedUpdates: {},
    };

    const update = mergeCandidateSelection(context, candidate, "soundcloud");

    expect(update.soundcloud_url).toBe(candidate.url);
  });

  it("fills image_url if not already set on artist", () => {
    const artist = makeArtist({ id: "a1", image_url: null });
    const candidate = makeCandidate({
      imageUrl: "https://example.com/img.jpg",
    });
    const context: MergeContext = {
      artist,
      stagedUpdates: {},
    };

    const update = mergeCandidateSelection(context, candidate, "spotify");

    expect(update.image_url).toBe(candidate.imageUrl);
  });

  it("does not overwrite existing image_url on artist", () => {
    const artist = makeArtist({
      id: "a1",
      image_url: "https://existing.com/img.jpg",
    });
    const candidate = makeCandidate({
      imageUrl: "https://example.com/img.jpg",
    });
    const context: MergeContext = {
      artist,
      stagedUpdates: {},
    };

    const update = mergeCandidateSelection(context, candidate, "spotify");

    expect(update.image_url).toBeUndefined();
  });

  it("does not overwrite staged image_url", () => {
    const artist = makeArtist({ id: "a1", image_url: null });
    const candidate = makeCandidate({
      imageUrl: "https://example.com/img.jpg",
    });
    const context: MergeContext = {
      artist,
      stagedUpdates: { image_url: "https://staged.com/img.jpg" },
    };

    const update = mergeCandidateSelection(context, candidate, "spotify");

    expect(update.image_url).toBeUndefined();
  });

  it("fills description if not already set on artist", () => {
    const artist = makeArtist({ id: "a1", description: null });
    const candidate = makeCandidate({ name: "Test Band" });
    const context: MergeContext = {
      artist,
      stagedUpdates: {},
    };

    const update = mergeCandidateSelection(context, candidate, "spotify");

    expect(update.description).toBe("Test Band");
  });

  it("does not overwrite existing description on artist", () => {
    const artist = makeArtist({
      id: "a1",
      description: "Existing description",
    });
    const candidate = makeCandidate({ name: "Test Band" });
    const context: MergeContext = {
      artist,
      stagedUpdates: {},
    };

    const update = mergeCandidateSelection(context, candidate, "spotify");

    expect(update.description).toBeUndefined();
  });

  it("does not overwrite staged description", () => {
    const artist = makeArtist({ id: "a1", description: null });
    const candidate = makeCandidate({ name: "Test Band" });
    const context: MergeContext = {
      artist,
      stagedUpdates: { description: "Staged description" },
    };

    const update = mergeCandidateSelection(context, candidate, "spotify");

    expect(update.description).toBeUndefined();
  });

  it("first provider selection wins shared image_url when both providers selected", () => {
    const artist = makeArtist({ id: "a1" });
    const spotifyCandidate = makeCandidate({
      url: "https://spotify.com/artist/123",
      imageUrl: "https://spotify.com/img.jpg",
    });
    const soundcloudCandidate = makeCandidate({
      url: "https://soundcloud.com/artist",
      imageUrl: "https://soundcloud.com/img.jpg",
    });

    // First selection - Spotify
    const context1: MergeContext = {
      artist,
      stagedUpdates: {},
    };
    const update1 = mergeCandidateSelection(
      context1,
      spotifyCandidate,
      "spotify",
    );

    // Second selection - SoundCloud
    const context2: MergeContext = {
      artist,
      stagedUpdates: update1,
    };
    const update2 = mergeCandidateSelection(
      context2,
      soundcloudCandidate,
      "soundcloud",
    );

    // Spotify's image wins because it was set first
    expect(update1.image_url).toBe("https://spotify.com/img.jpg");
    expect(update2.image_url).toBeUndefined();
  });

  it("never writes genres to updates", () => {
    const artist = makeArtist({ id: "a1" });
    const candidate = makeCandidate({ genres: ["rock", "pop"] });
    const context: MergeContext = {
      artist,
      stagedUpdates: {},
    };

    const update = mergeCandidateSelection(context, candidate, "spotify");

    expect(update).not.toHaveProperty("genres");
  });
});
