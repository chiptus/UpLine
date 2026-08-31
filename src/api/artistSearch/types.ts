import { z } from "zod";

export const providerSchema = z.enum(["soundcloud", "spotify"]);
export type Provider = z.infer<typeof providerSchema>;

export const candidateSchema = z.object({
  name: z.string(),
  url: z.string(),
  imageUrl: z.string().nullable(),
  description: z.string().nullable(),
  followers: z.number().nullable(),
  genres: z.array(z.string()),
});
export type Candidate = z.infer<typeof candidateSchema>;

export const searchResultSchema = z.object({
  artistName: z.string(),
  provider: providerSchema,
  candidates: z.array(candidateSchema),
  error: z.string().optional(),
  rateLimitRetryAfter: z.number().optional(),
});
export type SearchResult = z.infer<typeof searchResultSchema>;

export const searchResponseSchema = z.object({
  results: z.array(searchResultSchema),
});
export type SearchResponse = z.infer<typeof searchResponseSchema>;

export const artistSearchKeys = {
  all: ["artistSearch"] as const,
  searches: () => [...artistSearchKeys.all, "search"] as const,
  search: (artistNames: string[], provider?: Provider) =>
    [...artistSearchKeys.searches(), { artistNames, provider }] as const,
};
