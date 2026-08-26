import type { Candidate, ProviderSearchOutcome } from "../_shared/types.ts";

export type { Candidate, ProviderSearchOutcome };

export type Provider = "soundcloud" | "spotify";

export interface SearchRequest {
  artistNames: string[];
  provider?: Provider;
}

export interface SearchResult {
  artistName: string;
  provider: Provider;
  candidates: Candidate[];
  error?: string;
}

export interface SearchResponse {
  results: SearchResult[];
}
