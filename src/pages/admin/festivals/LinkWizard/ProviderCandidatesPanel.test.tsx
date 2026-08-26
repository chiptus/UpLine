import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("shows search input when button is clicked", async () => {
    const user = userEvent.setup();
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
    await user.click(button);

    expect(
      screen.getByRole("textbox", { name: /search spotify/i }),
    ).toBeInTheDocument();
  });

  it("pre-fills search input with artist name when opened", async () => {
    const user = userEvent.setup();
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
    await user.click(button);

    const input = screen.getByRole("textbox", { name: /search spotify/i });
    expect(input).toHaveValue("Test Artist");
  });

  it("allows editing the pre-filled search value", async () => {
    const user = userEvent.setup();
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
    await user.click(button);

    const input = screen.getByRole("textbox", { name: /search spotify/i });
    await user.clear(input);
    await user.type(input, "Modified Name");

    expect(input).toHaveValue("Modified Name");
  });

  it("clears search input when button is clicked again and re-fills with artist name on re-open", async () => {
    const user = userEvent.setup();
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

    await user.click(button);
    let input = screen.getByRole("textbox", { name: /search spotify/i });
    expect(input).toHaveValue("Test Artist");

    await user.clear(input);
    await user.type(input, "Modified Name");
    expect(input).toHaveValue("Modified Name");

    await user.click(button);
    expect(
      screen.queryByRole("textbox", { name: /search spotify/i }),
    ).not.toBeInTheDocument();

    await user.click(button);
    input = screen.getByRole("textbox", { name: /search spotify/i });
    expect(input).toHaveValue("Test Artist");
  });
});
