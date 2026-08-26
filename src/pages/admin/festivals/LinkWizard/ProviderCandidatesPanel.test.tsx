import { describe, expect, it, vi } from "vitest";
import { render, fireEvent, screen } from "@testing-library/react";
import { withTestQuery } from "@/test/withTestQuery";
import { withSuspense } from "@/test/withSuspense";
import { ProviderCandidatesPanel } from "./ProviderCandidatesPanel";
import type { UseQueryResult } from "@tanstack/react-query";
import type { SearchResponse } from "@/api/artistSearch/types";

const TestProviderCandidatesPanel = withSuspense(
  withTestQuery(ProviderCandidatesPanel),
);

const mockQueryResult: UseQueryResult<SearchResponse> = {
  data: { results: [] },
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
} as unknown as UseQueryResult<SearchResponse>;

describe("ProviderCandidatesPanel", () => {
  it('displays button labeled "Custom search"', () => {
    render(
      <TestProviderCandidatesPanel
        provider="spotify"
        label="Spotify"
        artistName="Test Artist"
        batchQueryResult={mockQueryResult}
        onSelectCandidate={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /custom search/i }),
    ).toBeInTheDocument();
  });

  it("shows search input when button is clicked", () => {
    render(
      <TestProviderCandidatesPanel
        provider="spotify"
        label="Spotify"
        artistName="Test Artist"
        batchQueryResult={mockQueryResult}
        onSelectCandidate={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: /custom search/i });
    fireEvent.click(button);

    expect(
      screen.getByRole("textbox", { name: /search spotify/i }),
    ).toBeInTheDocument();
  });

  it("pre-fills search input with artist name when opened", () => {
    render(
      <TestProviderCandidatesPanel
        provider="spotify"
        label="Spotify"
        artistName="Test Artist"
        batchQueryResult={mockQueryResult}
        onSelectCandidate={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: /custom search/i });
    fireEvent.click(button);

    const input = screen.getByRole("textbox", {
      name: /search spotify/i,
    }) as HTMLInputElement;
    expect(input.value).toBe("Test Artist");
  });

  it("allows editing the pre-filled search value", () => {
    render(
      <TestProviderCandidatesPanel
        provider="spotify"
        label="Spotify"
        artistName="Test Artist"
        batchQueryResult={mockQueryResult}
        onSelectCandidate={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: /custom search/i });
    fireEvent.click(button);

    const input = screen.getByRole("textbox", {
      name: /search spotify/i,
    }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Modified Name" } });

    expect(input.value).toBe("Modified Name");
  });

  it("clears search input when button is clicked again and re-fills with artist name on re-open", () => {
    render(
      <TestProviderCandidatesPanel
        provider="spotify"
        label="Spotify"
        artistName="Test Artist"
        batchQueryResult={mockQueryResult}
        onSelectCandidate={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: /custom search/i });

    fireEvent.click(button);
    let input = screen.getByRole("textbox", {
      name: /search spotify/i,
    }) as HTMLInputElement;
    expect(input.value).toBe("Test Artist");

    fireEvent.change(input, { target: { value: "Modified Name" } });
    expect(input.value).toBe("Modified Name");

    fireEvent.click(button);
    expect(
      screen.queryByRole("textbox", { name: /search spotify/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(button);
    input = screen.getByRole("textbox", {
      name: /search spotify/i,
    }) as HTMLInputElement;
    expect(input.value).toBe("Test Artist");
  });
});
