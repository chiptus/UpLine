export type Provider = "soundcloud" | "spotify";

export interface SearchRequest {
  artistNames: string[];
  provider?: Provider;
}

export interface Candidate {
  name: string;
  url: string;
  imageUrl: string | null;
  description: string | null;
  followers: number | null;
  genres: string[];
}

export interface ProviderSearchOutcome {
  candidates: Candidate[];
  error?: string;
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
