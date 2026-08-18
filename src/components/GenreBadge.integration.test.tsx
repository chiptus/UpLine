import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { GenreBadge } from "./GenreBadge";
import {
  renderWithQueryClient,
  testSupabase,
  waitForQueriesSettled,
} from "@/test/integration/harness";

describe("GenreBadge", () => {
  it("renders genre name when genre is found", async () => {
    const genreId = await getGenreIdByName("Techno");

    await renderGenreBadge(genreId);

    expect(screen.getByText("Techno")).toBeInTheDocument();
  });

  it("finds the correct genre among the other seeded genres", async () => {
    const genreId = await getGenreIdByName("House");

    await renderGenreBadge(genreId);

    expect(screen.getByText("House")).toBeInTheDocument();
    expect(screen.queryByText("Techno")).not.toBeInTheDocument();
  });

  // Whether the whole genres list is empty or just doesn't contain this
  // genreId, GenreBadge takes the same `find` fallthrough to null — the
  // "empty" case for the underlying query itself is already covered by
  // useGenres.integration.test.ts, so it isn't repeated here.
  it("renders null when genre is not found", async () => {
    const { container } = await renderGenreBadge(crypto.randomUUID());

    expect(container.firstChild).toBeNull();
  });

  it("renders with default size", async () => {
    const genreId = await getGenreIdByName("Techno");

    const { container } = await renderGenreBadge(genreId);

    const badge = container.querySelector("div");
    expect(badge).not.toHaveClass("text-xs", "px-2", "py-1");
  });

  it("renders with small size", async () => {
    const genreId = await getGenreIdByName("Techno");

    const { container } = await renderGenreBadge(genreId, "sm");

    const badge = container.querySelector("div");
    expect(badge).toHaveClass("text-xs", "px-2", "py-1");
  });
});

async function getGenreIdByName(name: string): Promise<string> {
  const { data, error } = await testSupabase
    .from("music_genres")
    .select("id")
    .eq("name", name)
    .single();
  if (error) throw error;
  return data.id;
}

async function renderGenreBadge(genreId: string, size?: "default" | "sm") {
  const utils = renderWithQueryClient(
    <GenreBadge genreId={genreId} size={size} />,
  );
  await waitForQueriesSettled(utils.queryClient);
  return utils;
}
