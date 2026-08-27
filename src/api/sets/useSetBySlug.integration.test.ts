import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { testSupabase } from "@/test/integration/harness";
import { setBySlugQuery } from "./useSetBySlug";
import { createQueryWrapper } from "@/test/integration/harness";
import { createSet } from "@/test/integration/fixtures/sets";
import { createScratchFestivalEdition } from "@/test/integration/fixtures/scratchPool";

async function getSlug(setId: string): Promise<string> {
  const { data, error } = await testSupabase
    .from("sets")
    .select("slug")
    .eq("id", setId)
    .single();
  if (error) throw error;
  return data.slug;
}

describe("setBySlugQuery", () => {
  it("returns a set with zero artists instead of failing (crash regression)", async () => {
    const editionId = await createScratchFestivalEdition();
    const setId = await createSet({
      festival_edition_id: editionId,
      set_type: "workshop",
      external_url: "https://example.com/workshop",
    });
    const slug = await getSlug(setId);

    const { result } = renderHook(
      () => useQuery(setBySlugQuery(slug, editionId)),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.id).toBe(setId);
    expect(result.current.data?.artists).toEqual([]);
    expect(result.current.data?.set_type).toBe("workshop");
    expect(result.current.data?.external_url).toBe(
      "https://example.com/workshop",
    );
  });
});
