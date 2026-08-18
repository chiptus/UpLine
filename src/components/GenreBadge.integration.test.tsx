import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { GenreBadge } from "./GenreBadge";
import {
  renderWithQueryClient,
  testSupabase,
  waitForQueriesSettled,
} from "@/test/integration/harness";

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
  return renderWithQueryClient(<GenreBadge genreId={genreId} size={size} />);
}

describe("GenreBadge", () => {
  it("renders genre name when genre is found", async () => {
    const genreId = await getGenreIdByName("Techno");

    const { queryClient } = renderGenreBadge(genreId);
    await waitForQueriesSettled(queryClient);

    expect(screen.getByText("Techno")).toBeInTheDocument();
  });

  it("finds the correct genre among the other seeded genres", async () => {
    const genreId = await getGenreIdByName("House");

    const { queryClient } = renderGenreBadge(genreId);
    await waitForQueriesSettled(queryClient);

    expect(screen.getByText("House")).toBeInTheDocument();
    expect(screen.queryByText("Techno")).not.toBeInTheDocument();
  });

  // Whether the whole genres list is empty or just doesn't contain this
  // genreId, GenreBadge takes the same `find` fallthrough to null — the
  // "empty" case for the underlying query itself is already covered by
  // useGenres.integration.test.ts, so it isn't repeated here.
  it("renders null when genre is not found", async () => {
    const { queryClient, container } = renderGenreBadge(crypto.randomUUID());
    await waitForQueriesSettled(queryClient);

    expect(container.firstChild).toBeNull();
  });

  it("renders with default size", async () => {
    const genreId = await getGenreIdByName("Techno");

    const { queryClient, container } = renderGenreBadge(genreId);
    await waitForQueriesSettled(queryClient);

    const badge = container.querySelector("div");
    expect(badge).not.toHaveClass("text-xs", "px-2", "py-1");
  });

  it("renders with small size", async () => {
    const genreId = await getGenreIdByName("Techno");

    const { queryClient, container } = renderGenreBadge(genreId, "sm");
    await waitForQueriesSettled(queryClient);

    const badge = container.querySelector("div");
    expect(badge).toHaveClass("text-xs", "px-2", "py-1");
  });

  it("has correct styling classes", async () => {
    const genreId = await getGenreIdByName("Techno");

    const { queryClient, container } = renderGenreBadge(genreId);
    await waitForQueriesSettled(queryClient);

    const badge = container.querySelector("div");
    expect(badge).toHaveClass("bg-purple-600/50", "text-purple-100");
  });
});
