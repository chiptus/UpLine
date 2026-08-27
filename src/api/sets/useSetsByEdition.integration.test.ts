import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { setsByEditionQuery } from "./useSetsByEdition";
import { createQueryWrapper } from "@/test/integration/harness";
import { createArtist } from "@/test/integration/fixtures/artists";
import { createSet } from "@/test/integration/fixtures/sets";
import { createScratchFestivalEdition } from "@/test/integration/fixtures/scratchPool";
import { linkArtistToSet } from "@/test/integration/fixtures/setArtists";

describe("setsByEditionQuery", () => {
  // Each run creates its own rows, so repeats never collide.
  it.each(["first run", "second run"])(
    "returns only the set(s) scoped to a freshly created edition (%s)",
    async () => {
      const editionId = await createScratchFestivalEdition();
      const artistId = await createArtist();
      const setId = await createSet({ festival_edition_id: editionId });
      await linkArtistToSet(setId, artistId);

      const { result } = renderHook(
        () => useQuery(setsByEditionQuery(editionId)),
        { wrapper: createQueryWrapper() },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].id).toBe(setId);
      expect(
        result.current.data?.[0].artists.map((artist) => artist.id),
      ).toEqual([artistId]);
    },
  );

  it("round-trips set_type and external_url for a typed set", async () => {
    const editionId = await createScratchFestivalEdition();
    const setId = await createSet({
      festival_edition_id: editionId,
      set_type: "workshop",
      external_url: "https://example.com/workshop",
    });

    const { result } = renderHook(
      () => useQuery(setsByEditionQuery(editionId)),
      {
        wrapper: createQueryWrapper(),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const set = result.current.data?.find((s) => s.id === setId);
    expect(set?.set_type).toBe("workshop");
    expect(set?.external_url).toBe("https://example.com/workshop");
  });

  it("keeps set_type and external_url null for an untyped legacy set", async () => {
    const editionId = await createScratchFestivalEdition();
    const setId = await createSet({ festival_edition_id: editionId });

    const { result } = renderHook(
      () => useQuery(setsByEditionQuery(editionId)),
      {
        wrapper: createQueryWrapper(),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const set = result.current.data?.find((s) => s.id === setId);
    expect(set?.set_type).toBeNull();
    expect(set?.external_url).toBeNull();
  });

  it("round-trips an external link on an otherwise untyped set", async () => {
    const editionId = await createScratchFestivalEdition();
    const setId = await createSet({
      festival_edition_id: editionId,
      external_url: "https://example.com/details",
    });

    const { result } = renderHook(
      () => useQuery(setsByEditionQuery(editionId)),
      {
        wrapper: createQueryWrapper(),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const set = result.current.data?.find((s) => s.id === setId);
    expect(set?.set_type).toBeNull();
    expect(set?.external_url).toBe("https://example.com/details");
  });
});
