import { describe, expect, it } from "vitest";
import {
  selectArtistsMissingLinks,
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

describe("selectArtistsMissingLinks", () => {
  it("dedupes artists that appear in multiple sets", () => {
    const artist = makeArtist({ id: "a1", spotify_url: null });
    const sets: SetWithArtists[] = [
      { set_artists: [{ artists: artist }] },
      { set_artists: [{ artists: artist }] },
    ];

    expect(selectArtistsMissingLinks(sets)).toHaveLength(1);
  });

  it("excludes artists that already have both links", () => {
    const complete = makeArtist({
      id: "a1",
      spotify_url: "https://open.spotify.com/artist/a1",
      soundcloud_url: "https://soundcloud.com/a1",
    });
    const sets: SetWithArtists[] = [{ set_artists: [{ artists: complete }] }];

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
      { set_artists: [{ artists: missingSoundcloud }] },
      { set_artists: [{ artists: missingSpotify }] },
    ];

    const result = selectArtistsMissingLinks(sets);
    expect(result.map((a) => a.id).sort()).toEqual(["a1", "a2"]);
  });

  it("skips null set_artists join rows", () => {
    const sets: SetWithArtists[] = [
      { set_artists: [{ artists: null }] },
      { set_artists: null },
    ];

    expect(selectArtistsMissingLinks(sets)).toEqual([]);
  });
});
