import type { AdminArtistsSortKey } from "./searchSchema";

export type SortingKey = AdminArtistsSortKey;

export type SortConfig = {
  key: SortingKey;
  direction: "asc" | "desc";
};
