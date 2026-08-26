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
