import { describe, expect, it } from "vitest";
import { mergeCandidateSelection } from "./mergeCandidateSelection";
import type { Candidate } from "./types";

describe("mergeCandidateSelection", () => {
  it("sets providerUrl.spotify when url is selected for spotify", () => {
    const candidate = makeCandidate();

    const update = mergeCandidateSelection(candidate, "spotify", ["url"]);

    expect(update.providerUrl).toEqual({ spotify: candidate.url });
  });

  it("sets providerUrl.soundcloud when url is selected for soundcloud", () => {
    const candidate = makeCandidate({
      url: "https://soundcloud.com/artist",
    });

    const update = mergeCandidateSelection(candidate, "soundcloud", ["url"]);

    expect(update.providerUrl).toEqual({ soundcloud: candidate.url });
  });

  it("does not set providerUrl when url is not selected", () => {
    const candidate = makeCandidate();

    const update = mergeCandidateSelection(candidate, "spotify", ["image"]);

    expect(update.providerUrl).toBeUndefined();
  });

  it("sets image_url when image is selected", () => {
    const candidate = makeCandidate({
      imageUrl: "https://example.com/img.jpg",
    });

    const update = mergeCandidateSelection(candidate, "spotify", ["image"]);

    expect(update.image_url).toBe(candidate.imageUrl);
  });

  it("does not set image_url when the candidate has none", () => {
    const candidate = makeCandidate({ imageUrl: null });

    const update = mergeCandidateSelection(candidate, "spotify", ["image"]);

    expect(update.image_url).toBeUndefined();
  });

  it("sets description when description is selected", () => {
    const candidate = makeCandidate({ description: "A great artist." });

    const update = mergeCandidateSelection(candidate, "spotify", [
      "description",
    ]);

    expect(update.description).toBe(candidate.description);
  });

  it("does not set description when the candidate has none", () => {
    const candidate = makeCandidate({ description: null });

    const update = mergeCandidateSelection(candidate, "spotify", [
      "description",
    ]);

    expect(update.description).toBeUndefined();
  });

  it("sets all requested fields when multiple are selected", () => {
    const candidate = makeCandidate({
      imageUrl: "https://example.com/img.jpg",
      description: "A great artist.",
    });

    const update = mergeCandidateSelection(candidate, "spotify", [
      "url",
      "image",
      "description",
    ]);

    expect(update.providerUrl).toEqual({ spotify: candidate.url });
    expect(update.image_url).toBe(candidate.imageUrl);
    expect(update.description).toBe(candidate.description);
  });

  it("never writes genres to updates", () => {
    const candidate = makeCandidate({ genres: ["rock", "pop"] });

    const update = mergeCandidateSelection(candidate, "spotify", [
      "url",
      "image",
      "description",
    ]);

    expect(update).not.toHaveProperty("genres");
  });
});

function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    name: "Test Artist",
    url: "https://spotify.com/artist/123",
    imageUrl: "https://example.com/image.jpg",
    description: "A test artist bio.",
    followers: 1000,
    genres: ["rock", "pop"],
    ...overrides,
  };
}
