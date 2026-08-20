import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const SpotifyImageSchema = z.object({
  url: z.string(),
  height: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
});

export const SpotifyArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
  genres: z.array(z.string()).optional(),
  followers: z
    .object({
      total: z.number(),
    })
    .optional(),
  images: z.array(SpotifyImageSchema).optional(),
  external_urls: z.object({
    spotify: z.string(),
  }),
});

export const SpotifySearchResponseSchema = z.object({
  artists: z
    .object({
      items: z.array(SpotifyArtistSchema).optional(),
    })
    .optional(),
});

export type SpotifyImage = z.infer<typeof SpotifyImageSchema>;
export type SpotifyArtist = z.infer<typeof SpotifyArtistSchema>;
export type SpotifySearchResponse = z.infer<typeof SpotifySearchResponseSchema>;
