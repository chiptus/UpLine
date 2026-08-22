import { describe, expect, it } from "vitest";
import {
  selectArtistsMissingLinks,
  selectArtistSetsById,
  type SetWithArtists,
} from "./useArtistsMissingLinksByEdition";
import type { Artist } from "./types";

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

function makeSet(
  overrides: Partial<SetWithArtists> & { id: string },
): SetWithArtists {
  return {
    name: overrides.name ?? overrides.id,
    description: null,
    time_start: null,
    time_end: null,
    stage_id: null,
    stages: null,
    set_artists: null,
    ...overrides,
  };
}

describe("selectArtistsMissingLinks", () => {
  it("dedupes artists that appear in multiple sets", () => {
    const artist = makeArtist({ id: "a1", spotify_url: null });
    const sets: SetWithArtists[] = [
      makeSet({
        id: "s1",
        set_artists: [{ artist_id: "a1", role: null, artists: artist }],
      }),
      makeSet({
        id: "s2",
        set_artists: [{ artist_id: "a1", role: null, artists: artist }],
      }),
    ];

    const result = selectArtistsMissingLinks(sets);
    expect(result).toHaveLength(1);
    expect(result[0].sets.map((s) => s.id).sort()).toEqual(["s1", "s2"]);
  });

  it("excludes artists that already have both links", () => {
    const complete = makeArtist({
      id: "a1",
      spotify_url: "https://open.spotify.com/artist/a1",
      soundcloud_url: "https://soundcloud.com/a1",
    });
    const sets: SetWithArtists[] = [
      makeSet({
        id: "s1",
        set_artists: [{ artist_id: "a1", role: null, artists: complete }],
      }),
    ];

    expect(selectArtistsMissingLinks(sets)).toEqual([]);
  });

  it("includes artists missing only one of the two links", () => {
    const missingSoundcloud = makeArtist({
      id: "a1",
      spotify_url: "https://open.spotify.com/artist/a1",
      soundcloud_url: null,
    });
    const missingSpotify = makeArtist({
      id: "a2",
      spotify_url: null,
      soundcloud_url: "https://soundcloud.com/a2",
    });
    const sets: SetWithArtists[] = [
      makeSet({
        id: "s1",
        set_artists: [
          { artist_id: "a1", role: null, artists: missingSoundcloud },
        ],
      }),
      makeSet({
        id: "s2",
        set_artists: [{ artist_id: "a2", role: null, artists: missingSpotify }],
      }),
    ];

    const result = selectArtistsMissingLinks(sets);
    expect(result.map((a) => a.id).sort()).toEqual(["a1", "a2"]);
  });

  it("skips null set_artists join rows", () => {
    const sets: SetWithArtists[] = [
      makeSet({
        id: "s1",
        set_artists: [{ artist_id: "a1", role: null, artists: null }],
      }),
      makeSet({ id: "s2", set_artists: null }),
    ];

    expect(selectArtistsMissingLinks(sets)).toEqual([]);
  });
});

describe("selectArtistSetsById", () => {
  it("returns only sets the artist performs in, with co-performers", () => {
    const artist = makeArtist({ id: "a1" });
    const coPerformer = makeArtist({ id: "a2" });
    const sets: SetWithArtists[] = [
      makeSet({
        id: "s1",
        name: "Main Stage Set",
        stages: { name: "Main Stage" },
        set_artists: [
          { artist_id: "a1", role: "headliner", artists: artist },
          { artist_id: "a2", role: "support", artists: coPerformer },
        ],
      }),
      makeSet({
        id: "s2",
        name: "Other Set",
        set_artists: [{ artist_id: "a2", role: null, artists: coPerformer }],
      }),
    ];

    const result = selectArtistSetsById(sets, "a1");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s1");
    expect(result[0].stage_name).toBe("Main Stage");
    expect(result[0].co_performers).toEqual([
      { artist_id: "a1", artist_name: "a1", role: "headliner" },
      { artist_id: "a2", artist_name: "a2", role: "support" },
    ]);
  });

  it("returns an empty array when the artist has no sets", () => {
    const sets: SetWithArtists[] = [makeSet({ id: "s1", set_artists: null })];

    expect(selectArtistSetsById(sets, "a1")).toEqual([]);
  });
});
