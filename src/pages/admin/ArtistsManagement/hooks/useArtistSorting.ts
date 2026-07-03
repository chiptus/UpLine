import { useState, useMemo } from "react";
import type { Artist } from "@/api/artists/types";

export type SortingKey = keyof Omit<Artist, "artist_music_genres"> | "genres";

export type SortConfig = {
  key: SortingKey;
  direction: "asc" | "desc";
} | null;

export function useArtistSorting() {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  function handleSort(key: SortingKey) {
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === "asc" ? { key, direction: "desc" } : null;
      }
      return { key, direction: "asc" };
    });
  }

  const sortArtists = useMemo(() => {
    return (artists: Artist[]) => {
      if (!sortConfig) return artists;

      return [...artists].sort((a, b) => {
        let aValue:
          | string
          | number
          | boolean
          | { music_genre_id: string }[]
          | null;
        let bValue:
          | string
          | number
          | boolean
          | { music_genre_id: string }[]
          | null;

        if (sortConfig.key === "genres") {
          aValue = a.artist_music_genres?.length || 0;
          bValue = b.artist_music_genres?.length || 0;
        } else {
          aValue = a[sortConfig.key] || null;
          bValue = b[sortConfig.key] || null;
        }

        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === "asc" ? 1 : -1;
        if (bValue == null) return sortConfig.direction === "asc" ? -1 : 1;

        if (typeof aValue !== typeof bValue) return 0;

        // String comparison
        if (typeof aValue === "string" && typeof bValue === "string") {
          const comparison = aValue.localeCompare(bValue);
          return sortConfig.direction === "asc" ? comparison : -comparison;
        }

        // Numeric comparison
        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    };
  }, [sortConfig]);

  return {
    sortConfig,
    handleSort,
    sortArtists,
  };
}
