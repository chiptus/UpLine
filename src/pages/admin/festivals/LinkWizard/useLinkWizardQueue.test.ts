import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useLinkWizardQueue } from "./useLinkWizardQueue";
import { useLinkWizardSkipped } from "@/hooks/useLinkWizardSkipped";
import type {
  ArtistSetWithCoPerformers,
  ArtistWithSets,
} from "@/api/artists/useArtistsMissingLinksByEdition";

const EDITION_ID = "edition-1";

function useTestQueue(
  artists: ArtistWithSets[],
  untypedSets: ArtistSetWithCoPerformers[] = [],
) {
  const skippedHook = useLinkWizardSkipped(EDITION_ID);
  const queue = useLinkWizardQueue(artists, untypedSets, skippedHook);
  return { queue, skippedHook };
}

function mockArtist(
  id: string,
  name: string,
  sets: { stage_id: string | null }[] = [],
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
      set_type: null,
      co_performers: [],
    })),
  };
}

function mockSet(
  id: string,
  name: string,
  stageId: string | null = null,
): ArtistSetWithCoPerformers {
  return {
    id,
    name,
    description: null,
    time_start: null,
    time_end: null,
    stage_id: stageId,
    stage_name: stageId ? `Stage ${stageId}` : null,
    set_type: null,
    co_performers: [],
  };
}

describe("useLinkWizardQueue", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts on the first artist in the list", async () => {
    const artists = [mockArtist("1", "Artist 1"), mockArtist("2", "Artist 2")];

    const { result } = renderHook(() => useTestQueue(artists));

    await waitFor(() => {
      expect(result.current.queue.currentItem?.id).toBe("1");
    });
    expect(result.current.queue.position).toBe(1);
    expect(result.current.queue.total).toBe(2);
    expect(result.current.queue.items.map((i) => i.id)).toEqual(["1", "2"]);
  });

  it("reports position 0 and no current item for an empty queue", async () => {
    const { result } = renderHook(() => useTestQueue([]));

    await waitFor(() => {
      expect(result.current.queue.total).toBe(0);
    });
    expect(result.current.queue.position).toBe(0);
    expect(result.current.queue.currentItem).toBeUndefined();
  });

  it("narrows artists by selected stage and keeps currentItem consistent", async () => {
    const artists = [
      mockArtist("1", "Artist 1", [{ stage_id: "stage-a" }]),
      mockArtist("2", "Artist 2", [{ stage_id: "stage-b" }]),
      mockArtist("3", "Artist 3", [{ stage_id: "stage-a" }]),
    ];

    const { result } = renderHook(() => useTestQueue(artists));

    await waitFor(() => {
      expect(result.current.queue.currentItem?.id).toBe("1");
    });

    act(() => {
      result.current.queue.toggleStage("stage-a");
    });

    expect(result.current.queue.items.map((i) => i.id)).toEqual(["1", "3"]);
    expect(result.current.queue.currentItem?.id).toBe("1");
    expect(result.current.queue.selectedStages).toEqual(["stage-a"]);

    act(() => {
      result.current.queue.clearStages();
    });

    expect(result.current.queue.items.map((i) => i.id)).toEqual([
      "1",
      "2",
      "3",
    ]);
    expect(result.current.queue.selectedStages).toEqual([]);
  });

  it("skip marks the current artist skipped and advances to the next item", async () => {
    const artists = [
      mockArtist("1", "Artist 1"),
      mockArtist("2", "Artist 2"),
      mockArtist("3", "Artist 3"),
    ];

    const { result } = renderHook(() => useTestQueue(artists));

    await waitFor(() => {
      expect(result.current.queue.currentItem?.id).toBe("1");
    });

    act(() => {
      result.current.queue.skip();
    });

    await waitFor(() => {
      expect(result.current.queue.currentItem?.id).toBe("2");
    });
    expect(result.current.queue.items.map((i) => i.id)).toEqual(["2", "3"]);

    await waitFor(() => {
      expect(result.current.skippedHook.isSkipped("1")).toBe(true);
    });
  });

  it("save marks the current artist saved and advances to the next item", async () => {
    const artists = [mockArtist("1", "Artist 1"), mockArtist("2", "Artist 2")];

    const { result } = renderHook(() => useTestQueue(artists));

    await waitFor(() => {
      expect(result.current.queue.currentItem?.id).toBe("1");
    });

    act(() => {
      result.current.queue.save();
    });

    await waitFor(() => {
      expect(result.current.queue.currentItem?.id).toBe("2");
    });
    expect(result.current.queue.items.map((i) => i.id)).toEqual(["2"]);

    await waitFor(() => {
      const saved = result.current.skippedHook
        .getSkippedArtists()
        .find((record) => record.artistId === "1");
      expect(saved?.status).toBe("saved");
    });
  });

  it("skip/save on the last artist moves to the previous item instead of going out of bounds", async () => {
    const artists = [mockArtist("1", "Artist 1"), mockArtist("2", "Artist 2")];

    const { result } = renderHook(() => useTestQueue(artists));

    await waitFor(() => {
      expect(result.current.queue.currentItem?.id).toBe("1");
    });

    act(() => {
      result.current.queue.selectItem(result.current.queue.items[1]);
    });

    expect(result.current.queue.currentItem?.id).toBe("2");

    act(() => {
      result.current.queue.skip();
    });

    await waitFor(() => {
      expect(result.current.queue.items.map((i) => i.id)).toEqual(["1"]);
    });
    expect(result.current.queue.currentItem?.id).toBe("1");
  });

  it("selectItem jumps directly to the given item", async () => {
    const artists = [
      mockArtist("1", "Artist 1"),
      mockArtist("2", "Artist 2"),
      mockArtist("3", "Artist 3"),
    ];

    const { result } = renderHook(() => useTestQueue(artists));

    await waitFor(() => {
      expect(result.current.queue.currentItem?.id).toBe("1");
    });

    act(() => {
      result.current.queue.selectItem(result.current.queue.items[2]);
    });

    expect(result.current.queue.currentItem?.id).toBe("3");
    expect(result.current.queue.position).toBe(3);
  });

  it("prev moves to the prior item in the filtered list", async () => {
    const artists = [
      mockArtist("1", "Artist 1"),
      mockArtist("2", "Artist 2"),
      mockArtist("3", "Artist 3"),
    ];

    const { result } = renderHook(() => useTestQueue(artists));

    await waitFor(() => {
      expect(result.current.queue.currentItem?.id).toBe("1");
    });

    act(() => {
      result.current.queue.selectItem(result.current.queue.items[2]);
    });
    expect(result.current.queue.currentItem?.id).toBe("3");

    act(() => {
      result.current.queue.prev();
    });
    expect(result.current.queue.currentItem?.id).toBe("2");
  });

  it("keeps currentItem valid when a stage filter is toggled after skip/save", async () => {
    const artists = [
      mockArtist("1", "Artist 1", [{ stage_id: "stage-a" }]),
      mockArtist("2", "Artist 2", [{ stage_id: "stage-b" }]),
      mockArtist("3", "Artist 3", [{ stage_id: "stage-a" }]),
    ];

    const { result } = renderHook(() => useTestQueue(artists));

    await waitFor(() => {
      expect(result.current.queue.currentItem?.id).toBe("1");
    });

    act(() => {
      result.current.queue.skip();
    });

    await waitFor(() => {
      expect(result.current.queue.currentItem?.id).toBe("2");
    });

    act(() => {
      result.current.queue.toggleStage("stage-a");
    });

    expect(result.current.queue.items.map((i) => i.id)).toEqual(["3"]);
    expect(result.current.queue.currentItem?.id).toBe("3");
  });

  it("orders artist-less untyped set items after artist items", async () => {
    const artists = [mockArtist("1", "Artist 1")];
    const sets = [mockSet("set-1", "Morning Yoga")];

    const { result } = renderHook(() => useTestQueue(artists, sets));

    await waitFor(() => {
      expect(result.current.queue.items.map((i) => i.id)).toEqual([
        "1",
        "set-1",
      ]);
    });
    expect(result.current.queue.currentItem).toMatchObject({
      kind: "artist",
      id: "1",
    });
  });

  it("skipping a set item plainly advances without marking it in useLinkWizardSkipped", async () => {
    const sets = [mockSet("set-1", "Morning Yoga"), mockSet("set-2", "Talk")];

    const { result } = renderHook(() => useTestQueue([], sets));

    await waitFor(() => {
      expect(result.current.queue.currentItem?.id).toBe("set-1");
    });

    act(() => {
      result.current.queue.skip();
    });

    expect(result.current.queue.currentItem?.id).toBe("set-2");
    expect(result.current.queue.items.map((i) => i.id)).toEqual([
      "set-1",
      "set-2",
    ]);

    expect(result.current.skippedHook.getSkippedArtists()).toEqual([]);
  });

  it("saving a set item advances as if it were removed, without marking useLinkWizardSkipped", async () => {
    const sets = [mockSet("set-1", "Morning Yoga"), mockSet("set-2", "Talk")];

    const { result } = renderHook(() => useTestQueue([], sets));

    await waitFor(() => {
      expect(result.current.queue.currentItem?.id).toBe("set-1");
    });

    act(() => {
      result.current.queue.save();
    });

    expect(result.current.queue.currentItem?.id).toBe("set-2");
    expect(result.current.skippedHook.getSkippedArtists()).toEqual([]);
  });

  it("filters set items by stage alongside artist items", async () => {
    const artists = [mockArtist("1", "Artist 1", [{ stage_id: "stage-a" }])];
    const sets = [
      mockSet("set-a", "On Stage A", "stage-a"),
      mockSet("set-b", "On Stage B", "stage-b"),
    ];

    const { result } = renderHook(() => useTestQueue(artists, sets));

    await waitFor(() => {
      expect(result.current.queue.items).toHaveLength(3);
    });

    act(() => {
      result.current.queue.toggleStage("stage-a");
    });

    expect(result.current.queue.items.map((i) => i.id)).toEqual(["1", "set-a"]);
  });
});
