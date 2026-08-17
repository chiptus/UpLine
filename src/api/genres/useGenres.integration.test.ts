import { createElement, Suspense, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGenresQuery } from "./useGenres";
import { registerCleanup, testSupabase } from "@/test/integration/harness";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(Suspense, { fallback: null }, children),
    );
  };
}

describe("useGenresQuery", () => {
  it("returns the genres seeded in the local Supabase instance", async () => {
    const { result } = renderHook(() => useGenresQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data.length).toBeGreaterThan(0);
    });

    expect(result.current.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "Techno" })]),
    );
  });

  it("returns an empty array when there are no genres", async () => {
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

    const { result } = renderHook(() => useGenresQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });
});
