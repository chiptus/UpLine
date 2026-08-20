import type { AdminArtistsSortKey } from "@/lib/searchSchemas";

export type SortingKey = AdminArtistsSortKey;

export type SortConfig = {
  key: SortingKey;
  direction: "asc" | "desc";
};

export function useArtistSorting(
  sortConfig: SortConfig,
  onSortChange: (config: SortConfig) => void,
) {
  function handleSort(key: SortingKey) {
    if (sortConfig.key === key) {
      onSortChange({
        key,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      onSortChange({ key, direction: "asc" });
    }
  }

  return { handleSort };
}
