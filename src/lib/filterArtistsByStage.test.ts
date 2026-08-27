import { describe, it, expect } from "vitest";
import { filterArtistsByStage } from "./filterArtistsByStage";
import type { ArtistWithSets } from "@/api/artists/useArtistsMissingLinksByEdition";

function mockArtist(
  id: string,
  name: string,
  sets: { stage_id: string | null }[],
): ArtistWithSets {
  return {
    id,
    name,
    added_by: "test-user",
    archived: false,
    created_at: new Date().toISOString(),
    description: null,
    estimated_date: null,
    image_url: null,
    slug: `${name.toLowerCase()}-${id}`,
    soundcloud_url: null,
    spotify_url: null,
    stage: null,
    time_end: null,
    time_start: null,
    updated_at: new Date().toISOString(),
    artist_music_genres: [],
    sets: sets.map((s) => ({
      id: `set-${id}-${s.stage_id}`,
      name: `Set at ${s.stage_id}`,
      description: null,
      time_start: null,
      time_end: null,
      stage_id: s.stage_id,
      stage_name: s.stage_id ? `Stage ${s.stage_id}` : null,
      co_performers: [],
    })),
  };
}

describe("filterArtistsByStage", () => {
  it("returns all artists when selectedStageIds is empty", () => {
    const artists = [
      mockArtist("1", "Artist 1", [{ stage_id: "stage-a" }]),
      mockArtist("2", "Artist 2", [{ stage_id: "stage-b" }]),
    ];

    const result = filterArtistsByStage(artists, []);

    expect(result).toEqual(artists);
  });

  it("filters artists by a single stage", () => {
    const artists = [
      mockArtist("1", "Artist 1", [{ stage_id: "stage-a" }]),
      mockArtist("2", "Artist 2", [{ stage_id: "stage-b" }]),
      mockArtist("3", "Artist 3", [{ stage_id: "stage-a" }]),
    ];

    const result = filterArtistsByStage(artists, ["stage-a"]);

    expect(result).toHaveLength(2);
    expect(result.map((a) => a.id)).toEqual(["1", "3"]);
  });

  it("filters artists by multiple stages (OR semantics)", () => {
    const artists = [
      mockArtist("1", "Artist 1", [{ stage_id: "stage-a" }]),
      mockArtist("2", "Artist 2", [{ stage_id: "stage-b" }]),
      mockArtist("3", "Artist 3", [{ stage_id: "stage-c" }]),
      mockArtist("4", "Artist 4", [{ stage_id: "stage-a" }]),
    ];

    const result = filterArtistsByStage(artists, ["stage-a", "stage-b"]);

    expect(result).toHaveLength(3);
    expect(result.map((a) => a.id)).toEqual(["1", "2", "4"]);
  });

  it("excludes artists with no stage assignment", () => {
    const artists = [
      mockArtist("1", "Artist 1", [{ stage_id: "stage-a" }]),
      mockArtist("2", "Artist 2", [{ stage_id: null }]),
      mockArtist("3", "Artist 3", [{ stage_id: "stage-b" }]),
    ];

    const result = filterArtistsByStage(artists, ["stage-a"]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("excludes artists with no set assignment at all", () => {
    const artists = [
      mockArtist("1", "Artist 1", [{ stage_id: "stage-a" }]),
      mockArtist("2", "Artist 2", []),
    ];

    const result = filterArtistsByStage(artists, ["stage-a"]);

    expect(() => filterArtistsByStage(artists, ["stage-a"])).not.toThrow();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("includes artists with multiple sets when any set matches", () => {
    const artists = [
      mockArtist("1", "Artist 1", [
        { stage_id: "stage-a" },
        { stage_id: "stage-b" },
      ]),
      mockArtist("2", "Artist 2", [{ stage_id: "stage-c" }]),
    ];

    const result = filterArtistsByStage(artists, ["stage-b"]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("returns empty array when no artists match selection", () => {
    const artists = [
      mockArtist("1", "Artist 1", [{ stage_id: "stage-a" }]),
      mockArtist("2", "Artist 2", [{ stage_id: "stage-b" }]),
    ];

    const result = filterArtistsByStage(artists, ["stage-c"]);

    expect(result).toHaveLength(0);
  });
});
