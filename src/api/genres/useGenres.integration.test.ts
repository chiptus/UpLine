import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { genresQuery } from "./useGenres";
import {
  createQueryWrapper,
  registerCleanup,
  testSupabase,
} from "@/test/integration/harness";

describe("genresQuery", () => {
  it("returns the genres seeded in the local Supabase instance", async () => {
    const { result } = renderHook(() => useSuspenseQuery(genresQuery()), {
      wrapper: createQueryWrapper().Wrapper,
    });

    await waitFor(() => {
      expect(result.current.data.length).toBeGreaterThan(0);
    });

    expect(result.current.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "Techno" })]),
    );
  });

  it("returns an empty array when there are no genres", async () => {
    // music_genres has no per-request filter, so the only way to observe a
    // real empty response is to empty the whole (shared, seeded) table and
    // restore it after. #281 replaces this with scoped, uniquely-named
    // fixtures so tests stop touching shared seed data — until then, this
    // is deliberately the one place in the suite that does.
    const [genresSnapshot, linksSnapshot] = await Promise.all([
      testSupabase.from("music_genres").select("*"),
      testSupabase.from("artist_music_genres").select("*"),
    ]);
    if (genresSnapshot.error) throw genresSnapshot.error;
    if (linksSnapshot.error) throw linksSnapshot.error;

    // Register the restore before mutating, so it still runs (and puts the
    // shared seed data back) even if an assertion below throws.
    registerCleanup(async () => {
      if (genresSnapshot.data.length > 0) {
        const { error } = await testSupabase
          .from("music_genres")
          .insert(genresSnapshot.data);
        if (error) throw error;
      }
      if (linksSnapshot.data.length > 0) {
        const { error } = await testSupabase
          .from("artist_music_genres")
          .insert(linksSnapshot.data);
        if (error) throw error;
      }
    });

    const { error: deleteError } = await testSupabase
      .from("music_genres")
      .delete()
      .not("id", "is", null);
    if (deleteError) throw deleteError;

    const { result } = renderHook(() => useSuspenseQuery(genresQuery()), {
      wrapper: createQueryWrapper().Wrapper,
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });
});
