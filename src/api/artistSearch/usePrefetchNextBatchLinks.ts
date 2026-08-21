import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Artist } from "@/api/artists/types";
import { searchArtistLinksQuery } from "./useSearchArtistLinksQuery";

export function usePrefetchNextBatchLinks(
  artists: Artist[],
  currentArtistId: string | undefined,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentArtistId || artists.length === 0) return;

    const currentIdx = Math.max(
      0,
      artists.findIndex((a) => a.id === currentArtistId),
    );
    const positionInBatch = currentIdx % 10;

    if (positionInBatch < 8) return;

    const nextBatchStart = Math.floor(currentIdx / 10) * 10 + 10;
    const nextBatchArtists = artists
      .slice(nextBatchStart, nextBatchStart + 10)
      .map((a) => a.name);

    if (nextBatchArtists.length > 0) {
      queryClient.prefetchQuery(searchArtistLinksQuery(nextBatchArtists));
    }
  }, [currentArtistId, artists, queryClient]);
}
