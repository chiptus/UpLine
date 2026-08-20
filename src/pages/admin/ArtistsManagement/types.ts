import type { AdminArtistsSortKey } from "@/lib/searchSchemas";

export type SortingKey = AdminArtistsSortKey;

export type SortConfig = {
  key: SortingKey;
  direction: "asc" | "desc";
};
