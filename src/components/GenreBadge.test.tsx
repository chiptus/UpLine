import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UseQueryResult } from "@tanstack/react-query";
import { GenreBadge } from "./GenreBadge";
import * as useGenresModule from "@/api/genres/useGenres";
import type { Genre } from "@/api/genres/types";

vi.mock("@/api/genres/useGenres");

function mockGenresQuery(result: {
  data?: Genre[];
  isLoading?: boolean;
  error?: Error | null;
}) {
  vi.spyOn(useGenresModule, "useGenresQuery").mockReturnValue({
    data: result.data ?? [],
    isLoading: result.isLoading ?? false,
    error: result.error ?? null,
  } as unknown as UseQueryResult<Genre[], Error>);
}

describe("GenreBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders genre name when genre is found", () => {
    mockGenresQuery({
      data: [
        { id: "1", name: "Rock" },
        { id: "2", name: "Pop" },
      ],
    });

    render(<GenreBadge genreId="1" />);
    expect(screen.getByText("Rock")).toBeInTheDocument();
  });

  it("renders null when loading", () => {
    mockGenresQuery({ isLoading: true });

    const { container } = render(<GenreBadge genreId="1" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders null when error", () => {
    mockGenresQuery({ error: new Error("Failed to load") });

    const { container } = render(<GenreBadge genreId="1" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders null when genre is not found", () => {
    mockGenresQuery({
      data: [
        { id: "1", name: "Rock" },
        { id: "2", name: "Pop" },
      ],
    });

    const { container } = render(<GenreBadge genreId="999" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders with default size", () => {
    mockGenresQuery({ data: [{ id: "1", name: "Rock" }] });

    const { container } = render(<GenreBadge genreId="1" />);
    const badge = container.querySelector("div");
    expect(badge).not.toHaveClass("text-xs", "px-2", "py-1");
  });

  it("renders with small size", () => {
    mockGenresQuery({ data: [{ id: "1", name: "Rock" }] });

    const { container } = render(<GenreBadge genreId="1" size="sm" />);
    const badge = container.querySelector("div");
    expect(badge).toHaveClass("text-xs", "px-2", "py-1");
  });

  it("has correct styling classes", () => {
    mockGenresQuery({ data: [{ id: "1", name: "Rock" }] });

    const { container } = render(<GenreBadge genreId="1" />);
    const badge = container.querySelector("div");
    expect(badge).toHaveClass("bg-purple-600/50", "text-purple-100");
  });

  it("finds correct genre from multiple genres", () => {
    mockGenresQuery({
      data: [
        { id: "1", name: "Rock" },
        { id: "2", name: "Pop" },
        { id: "3", name: "Jazz" },
      ],
    });

    render(<GenreBadge genreId="2" />);
    expect(screen.getByText("Pop")).toBeInTheDocument();
    expect(screen.queryByText("Rock")).not.toBeInTheDocument();
    expect(screen.queryByText("Jazz")).not.toBeInTheDocument();
  });

  it("renders when genres list is empty", () => {
    mockGenresQuery({ data: [] });

    const { container } = render(<GenreBadge genreId="1" />);
    expect(container.firstChild).toBeNull();
  });
});
