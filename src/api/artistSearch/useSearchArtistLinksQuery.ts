import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { artistSearchKeys, type SearchResponse, type Provider } from "./types";

async function fetchSearchArtistLinks(
  artistNames: string[],
  provider?: Provider,
): Promise<SearchResponse> {
  if (artistNames.length === 0) {
    return { results: [] };
  }

  const { data, error } = await supabase.functions.invoke(
    "search-artist-links",
    {
      body: {
        artistNames,
        provider,
      },
    },
  );

  if (error) {
    console.error("Error searching artist links:", error);
    throw new Error("Failed to search artist links");
  }

  return data as SearchResponse;
}

export function searchArtistLinksQuery(
  artistNames: string[],
  provider?: Provider,
  batch?: number,
) {
  return queryOptions({
    queryKey: artistSearchKeys.search(batch ?? 0),
    queryFn: () => fetchSearchArtistLinks(artistNames, provider),
    enabled: artistNames.length > 0,
    staleTime: 1000 * 60 * 30,
  });
}

export function useSearchArtistLinksQuery(
  artistNames: string[],
  provider?: Provider,
  batch?: number,
) {
  return useQuery({
    ...searchArtistLinksQuery(artistNames, provider, batch),
  });
}
