import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const BrowserlessResponseSchema = z.object({
  html: z.string(),
});

export const ScrapedDataSchema = z.object({
  followersCount: z.number().nullable(),
  avatarUrl: z.string().nullable(),
  displayName: z.string().nullable(),
});

export const SoundCloudUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  permalink_url: z.string(),
  avatar_url: z.string().nullable().optional(),
  followers_count: z.number().optional(),
  full_name: z.string().nullable().optional(),
  display_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const SoundCloudTrackSchema = z.object({
  id: z.number(),
  title: z.string(),
  permalink_url: z.string(),
  stream_url: z.string().optional(),
  duration: z.number(),
  artwork_url: z.string().nullable().optional(),
  likes_count: z.number().optional().nullable(),
  playback_count: z.number().optional().nullable(),
  created_at: z.string(),
  user: SoundCloudUserSchema.optional(),
});

export const SoundCloudPlaylistSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  permalink_url: z.string(),
  artwork_url: z.string().nullable().optional(),
  user: SoundCloudUserSchema,
  track_count: z.number(),
  tracks: z.array(SoundCloudTrackSchema).optional(),
  likes_count: z.number().optional(),
  reposts_count: z.number().optional(),
  created_at: z.string(),
});

export const SoundCloudTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  scope: z.string(),
  refresh_token: z.string(),
});

export const SoundCloudErrorResponseSchema = z.object({
  error: z.string(),
  error_description: z.string().optional(),
});

export const SoundCloudPlaylistArraySchema = z.array(SoundCloudPlaylistSchema);
export const SoundCloudTrackArraySchema = z.array(SoundCloudTrackSchema);

export type BrowserlessResponse = z.infer<typeof BrowserlessResponseSchema>;
export type ScrapedData = z.infer<typeof ScrapedDataSchema>;
export type SoundCloudUser = z.infer<typeof SoundCloudUserSchema>;
export type SoundCloudTrack = z.infer<typeof SoundCloudTrackSchema>;
export type SoundCloudPlaylist = z.infer<typeof SoundCloudPlaylistSchema>;
export type SoundCloudTokenResponse = z.infer<
  typeof SoundCloudTokenResponseSchema
>;
export type SoundCloudErrorResponse = z.infer<
  typeof SoundCloudErrorResponseSchema
>;
