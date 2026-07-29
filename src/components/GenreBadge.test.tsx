import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import * as reactQuery from "@tanstack/react-query";
import type { UseSuspenseQueryResult } from "@tanstack/react-query";
import { GenreBadge } from "./GenreBadge";
import type { Genre } from "@/api/genres/types";

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...(await importOriginal<typeof reactQuery>()),
  useSuspenseQuery: vi.fn(),
}));

function mockGenresQuery(data: Genre[]) {
  vi.mocked(reactQuery.useSuspenseQuery).mockReturnValue({
    data,
  } as unknown as UseSuspenseQueryResult<Genre[], Error>);
}

describe("GenreBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders genre name when genre is found", () => {
    mockGenresQuery([
      { id: "1", name: "Rock" },
      { id: "2", name: "Pop" },
    ]);

    render(<GenreBadge genreId="1" />);
    expect(screen.getByText("Rock")).toBeInTheDocument();
  });

  it("renders null when genre is not found", () => {
    mockGenresQuery([
      { id: "1", name: "Rock" },
      { id: "2", name: "Pop" },
    ]);

    const { container } = render(<GenreBadge genreId="999" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders with default size", () => {
    mockGenresQuery([{ id: "1", name: "Rock" }]);

    const { container } = render(<GenreBadge genreId="1" />);
    const badge = container.querySelector("div");
    expect(badge).not.toHaveClass("text-xs", "px-2", "py-1");
  });

  it("renders with small size", () => {
    mockGenresQuery([{ id: "1", name: "Rock" }]);

    const { container } = render(<GenreBadge genreId="1" size="sm" />);
    const badge = container.querySelector("div");
    expect(badge).toHaveClass("text-xs", "px-2", "py-1");
  });

  it("has correct styling classes", () => {
    mockGenresQuery([{ id: "1", name: "Rock" }]);

    const { container } = render(<GenreBadge genreId="1" />);
    const badge = container.querySelector("div");
    expect(badge).toHaveClass("bg-purple-600/50", "text-purple-100");
  });

  it("finds correct genre from multiple genres", () => {
    mockGenresQuery([
      { id: "1", name: "Rock" },
      { id: "2", name: "Pop" },
      { id: "3", name: "Jazz" },
    ]);

    render(<GenreBadge genreId="2" />);
    expect(screen.getByText("Pop")).toBeInTheDocument();
    expect(screen.queryByText("Rock")).not.toBeInTheDocument();
    expect(screen.queryByText("Jazz")).not.toBeInTheDocument();
  });

  it("renders when genres list is empty", () => {
    mockGenresQuery([]);

    const { container } = render(<GenreBadge genreId="1" />);
    expect(container.firstChild).toBeNull();
  });
});
