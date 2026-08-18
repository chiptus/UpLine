import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { GenreBadge } from "./GenreBadge";
import { testSupabase } from "@/test/integration/harness";

async function getGenreIdByName(name: string): Promise<string> {
  const { data, error } = await testSupabase
    .from("music_genres")
    .select("id")
    .eq("name", name)
    .single();
  if (error) throw error;
  return data.id;
}

function renderGenreBadge(genreId: string, size?: "default" | "sm") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <GenreBadge genreId={genreId} size={size} />
      </Suspense>
    </QueryClientProvider>,
  );
  return { queryClient, ...utils };
}

async function waitForSettled(queryClient: QueryClient) {
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
}

describe("GenreBadge", () => {
  it("renders genre name when genre is found", async () => {
    const genreId = await getGenreIdByName("Techno");

    const { queryClient } = renderGenreBadge(genreId);
    await waitForSettled(queryClient);

    expect(screen.getByText("Techno")).toBeInTheDocument();
  });

  // Whether the whole genres list is empty or just doesn't contain this
  // genreId, GenreBadge takes the same `find` fallthrough to null — the
  // "empty" case for the underlying query itself is already covered by
  // useGenres.integration.test.ts, so it isn't repeated here.
  it("renders null when genre is not found", async () => {
    const { queryClient, container } = renderGenreBadge(crypto.randomUUID());
    await waitForSettled(queryClient);

    expect(container.firstChild).toBeNull();
  });

  it("renders with default size", async () => {
    const genreId = await getGenreIdByName("Techno");

    const { queryClient, container } = renderGenreBadge(genreId);
    await waitForSettled(queryClient);

    const badge = container.querySelector("div");
    expect(badge).not.toHaveClass("text-xs", "px-2", "py-1");
  });

  it("renders with small size", async () => {
    const genreId = await getGenreIdByName("Techno");

    const { queryClient, container } = renderGenreBadge(genreId, "sm");
    await waitForSettled(queryClient);

    const badge = container.querySelector("div");
    expect(badge).toHaveClass("text-xs", "px-2", "py-1");
  });

  it("has correct styling classes", async () => {
    const genreId = await getGenreIdByName("Techno");

    const { queryClient, container } = renderGenreBadge(genreId);
    await waitForSettled(queryClient);

    const badge = container.querySelector("div");
    expect(badge).toHaveClass("bg-purple-600/50", "text-purple-100");
  });
});
