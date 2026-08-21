import type { Artist } from "@/api/artists/types";
import { useSearchArtistLinksQuery } from "@/api/artistSearch/useSearchArtistLinksQuery";

export function useArtistBatchQuery(artist: Artist, artists: Artist[]) {
  const currentIndex = artists.findIndex((a) => a.id === artist.id);
  const batchStart = Math.floor(currentIndex / 10) * 10;
  const batchArtists = artists
    .slice(batchStart, batchStart + 10)
    .map((a) => a.name);

  return useSearchArtistLinksQuery(batchArtists);
}
