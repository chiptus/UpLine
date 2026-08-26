import { Suspense } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProviderCandidatesPanel } from "./ProviderCandidatesPanel";
import type { UseQueryResult } from "@tanstack/react-query";
import type { SearchResponse } from "@/api/artistSearch/types";

function renderWithQueryClient(element: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>{element}</Suspense>
    </QueryClientProvider>,
  );
}

const mockQueryResult: UseQueryResult<SearchResponse> = {
  data: { results: [] },
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
} as unknown as UseQueryResult<SearchResponse>;

describe("ProviderCandidatesPanel", () => {
  it('displays button labeled "Custom search"', () => {
    renderWithQueryClient(
      <ProviderCandidatesPanel
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
    renderWithQueryClient(
      <ProviderCandidatesPanel
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
    renderWithQueryClient(
      <ProviderCandidatesPanel
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
    renderWithQueryClient(
      <ProviderCandidatesPanel
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
    renderWithQueryClient(
      <ProviderCandidatesPanel
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
