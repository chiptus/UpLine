import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { GenreBadge } from "./GenreBadge";
import * as useGenresModule from "@/api/genres/useGenres";

vi.mock("@/api/genres/useGenres");

describe("GenreBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders genre name when genre is found", () => {
    vi.spyOn(useGenresModule, "useGenres").mockReturnValue({
      genres: [
        { id: "1", name: "Rock" },
        { id: "2", name: "Pop" },
      ],
      loading: false,
      error: null,
    });

    render(<GenreBadge genreId="1" />);
    expect(screen.getByText("Rock")).toBeInTheDocument();
  });

  it("renders null when loading", () => {
    vi.spyOn(useGenresModule, "useGenres").mockReturnValue({
      genres: [],
      loading: true,
      error: null,
    });

    const { container } = render(<GenreBadge genreId="1" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders null when error", () => {
    vi.spyOn(useGenresModule, "useGenres").mockReturnValue({
      genres: [],
      loading: false,
      error: new Error("Failed to load"),
    });

    const { container } = render(<GenreBadge genreId="1" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders null when genre is not found", () => {
    vi.spyOn(useGenresModule, "useGenres").mockReturnValue({
      genres: [
        { id: "1", name: "Rock" },
        { id: "2", name: "Pop" },
      ],
      loading: false,
      error: null,
    });

    const { container } = render(<GenreBadge genreId="999" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders with default size", () => {
    vi.spyOn(useGenresModule, "useGenres").mockReturnValue({
      genres: [{ id: "1", name: "Rock" }],
      loading: false,
      error: null,
    });

    const { container } = render(<GenreBadge genreId="1" />);
    const badge = container.querySelector("div");
    expect(badge).not.toHaveClass("text-xs", "px-2", "py-1");
  });

  it("renders with small size", () => {
    vi.spyOn(useGenresModule, "useGenres").mockReturnValue({
      genres: [{ id: "1", name: "Rock" }],
      loading: false,
      error: null,
    });

    const { container } = render(<GenreBadge genreId="1" size="sm" />);
    const badge = container.querySelector("div");
    expect(badge).toHaveClass("text-xs", "px-2", "py-1");
  });

  it("has correct styling classes", () => {
    vi.spyOn(useGenresModule, "useGenres").mockReturnValue({
      genres: [{ id: "1", name: "Rock" }],
      loading: false,
      error: null,
    });

    const { container } = render(<GenreBadge genreId="1" />);
    const badge = container.querySelector("div");
    expect(badge).toHaveClass("bg-purple-600/50", "text-purple-100");
  });

  it("finds correct genre from multiple genres", () => {
    vi.spyOn(useGenresModule, "useGenres").mockReturnValue({
      genres: [
        { id: "1", name: "Rock" },
        { id: "2", name: "Pop" },
        { id: "3", name: "Jazz" },
      ],
      loading: false,
      error: null,
    });

    render(<GenreBadge genreId="2" />);
    expect(screen.getByText("Pop")).toBeInTheDocument();
    expect(screen.queryByText("Rock")).not.toBeInTheDocument();
    expect(screen.queryByText("Jazz")).not.toBeInTheDocument();
  });

  it("renders when genres list is empty", () => {
    vi.spyOn(useGenresModule, "useGenres").mockReturnValue({
      genres: [],
      loading: false,
      error: null,
    });

    const { container } = render(<GenreBadge genreId="1" />);
    expect(container.firstChild).toBeNull();
  });
});
