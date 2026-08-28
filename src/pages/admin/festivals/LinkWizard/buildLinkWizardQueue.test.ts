import { describe, expect, it } from "vitest";
import type {
  ArtistSetWithCoPerformers,
  ArtistWithSets,
} from "@/api/artists/useArtistsMissingLinksByEdition";
import { buildLinkWizardQueue } from "./buildLinkWizardQueue";

function makeSet(
  overrides: Partial<ArtistSetWithCoPerformers> = {},
): ArtistSetWithCoPerformers {
  return {
    id: "set-1",
    name: "Some Set",
    description: null,
    time_start: null,
    time_end: null,
    stage_id: null,
    stage_name: null,
    set_type: null,
    co_performers: [],
    ...overrides,
  };
}

function makeArtist(overrides: {
  id: string;
  name?: string;
  sets?: ArtistSetWithCoPerformers[];
}): ArtistWithSets {
  return {
    id: overrides.id,
    name: overrides.name ?? overrides.id,
    sets: overrides.sets ?? [],
  } as ArtistWithSets;
}

describe("buildLinkWizardQueue", () => {
  it("returns artist items followed by artist-less untyped set items", () => {
    const artistSet = makeSet({
      id: "set-a",
      name: "Artist Set",
      co_performers: [
        { artist_id: "artist-1", artist_name: "Artist 1", role: null },
      ],
    });
    const artist = makeArtist({ id: "artist-1", sets: [artistSet] });
    const orphanSet = makeSet({ id: "set-b", name: "Morning Yoga" });

    const queue = buildLinkWizardQueue([artist], [artistSet, orphanSet]);

    expect(queue).toHaveLength(2);
    expect(queue[0]).toMatchObject({ kind: "artist", id: "artist-1" });
    expect(queue[1]).toMatchObject({ kind: "set", id: "set-b" });
  });

  it("never emits a set item for an untyped set that has artists, queued or not", () => {
    const setOfLinkedArtist = makeSet({
      id: "set-x",
      co_performers: [
        { artist_id: "linked-artist", artist_name: "Linked", role: null },
      ],
    });

    const queue = buildLinkWizardQueue([], [setOfLinkedArtist]);

    expect(queue).toHaveLength(0);
  });

  it("returns an empty queue when there are no artists and no untyped sets", () => {
    expect(buildLinkWizardQueue([], [])).toEqual([]);
  });

  it("filters set items by stage when stage ids are selected", () => {
    const onStage = makeSet({ id: "set-on", stage_id: "stage-1" });
    const offStage = makeSet({ id: "set-off", stage_id: "stage-2" });
    const noStage = makeSet({ id: "set-none", stage_id: null });

    const queue = buildLinkWizardQueue(
      [],
      [onStage, offStage, noStage],
      ["stage-1"],
    );

    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ kind: "set", id: "set-on" });
  });
});
