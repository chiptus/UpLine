import { useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useSearchArtistLinksQuery } from "@/api/artistSearch/useSearchArtistLinksQuery";
import type {
  Candidate,
  Provider,
  SearchResponse,
} from "@/api/artistSearch/types";

const PROVIDER_LABELS: Record<Provider, string> = {
  spotify: "Spotify",
  soundcloud: "SoundCloud",
};

export function useProviderCandidates(
  provider: Provider,
  artistName: string,
  batchQueryResult: UseQueryResult<SearchResponse>,
) {
  const [customSearch, setCustomSearch] = useState("");

  const customResult = useSearchArtistLinksQuery(
    customSearch ? [customSearch] : [],
    provider,
  );

  const isLoading = batchQueryResult.isLoading || customResult.isLoading;

  const { candidates, error, rateLimitRetryAfter } = resolveProviderResult({
    provider,
    artistName,
    customSearch,
    customResult,
    batchQueryResult,
  });

  function search(query: string) {
    if (query === customSearch) {
      customResult.refetch();
      return;
    }
    setCustomSearch(query);
  }

  const displayError = buildErrorMessage(error, rateLimitRetryAfter);

  return { candidates, error: displayError, isLoading, search };
}

interface ResolveProviderResultArgs {
  provider: Provider;
  artistName: string;
  customSearch: string;
  customResult: UseQueryResult<SearchResponse>;
  batchQueryResult: UseQueryResult<SearchResponse>;
}

function resolveProviderResult({
  provider,
  artistName,
  customSearch,
  customResult,
  batchQueryResult,
}: ResolveProviderResultArgs): {
  candidates: Candidate[];
  error?: string | undefined;
  rateLimitRetryAfter?: number | undefined;
} {
  const providerLabel = PROVIDER_LABELS[provider];

  if (customSearch) {
    if (customResult.isError) {
      return {
        candidates: [],
        error: `${providerLabel} search failed. Please try again.`,
      };
    }
    const result = customResult.data?.results.find(
      (r) => r.provider === provider,
    );
    return {
      candidates: result?.candidates ?? [],
      error: result?.error,
      rateLimitRetryAfter: result?.rateLimitRetryAfter,
    };
  }

  if (batchQueryResult.isError) {
    return {
      candidates: [],
      error: `${providerLabel} search failed. Please try again.`,
    };
  }

  const result = batchQueryResult.data?.results.find(
    (r) => r.artistName === artistName && r.provider === provider,
  );
  return {
    candidates: result?.candidates ?? [],
    error: result?.error,
    rateLimitRetryAfter: result?.rateLimitRetryAfter,
  };
}

function buildErrorMessage(
  error?: string,
  retryAfterSeconds?: number,
): string | undefined {
  if (retryAfterSeconds) {
    return `Rate limited. Try again in ${retryAfterSeconds} second${retryAfterSeconds > 1 ? "s" : ""}.`;
  }

  return error;
}
