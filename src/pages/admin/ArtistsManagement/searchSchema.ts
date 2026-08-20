import { z } from "zod";

export const adminArtistsSortKeySchema = z.enum([
  "name",
  "description",
  "image_url",
  "spotify_url",
  "soundcloud_url",
  "created_at",
]);

export type AdminArtistsSortKey = z.infer<typeof adminArtistsSortKeySchema>;

export const adminArtistsPageSizeSchema = z.union([
  z.literal(10),
  z.literal(25),
  z.literal(50),
  z.literal(100),
]);
export type AdminArtistsPageSize = z.infer<typeof adminArtistsPageSizeSchema>;

export const adminArtistsSearchSchema = z.object({
  page: z.coerce.number().int().nonnegative().catch(0),
  pageSize: z.coerce.number().pipe(adminArtistsPageSizeSchema).catch(25),
  q: z.string().catch(""),
  sortKey: adminArtistsSortKeySchema.catch("created_at"),
  sortDir: z.enum(["asc", "desc"]).catch("desc"),
});

export type AdminArtistsSearch = z.infer<typeof adminArtistsSearchSchema>;

export const adminArtistsSearchDefaults: AdminArtistsSearch = {
  page: 0,
  pageSize: 25,
  q: "",
  sortKey: "created_at",
  sortDir: "desc",
};
