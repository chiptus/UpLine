export type Provider = "soundcloud" | "spotify";

export interface Candidate {
  name: string;
  url: string;
  imageUrl: string | null;
  description: string | null;
  followers: number | null;
  genres: string[];
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

export const artistSearchKeys = {
  all: ["artistSearch"] as const,
  searches: () => [...artistSearchKeys.all, "search"] as const,
  search: (artistNames: string[], provider?: Provider) =>
    [...artistSearchKeys.searches(), { artistNames, provider }] as const,
};
