import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  searchResponseSchema,
  type SearchResponse,
  type Provider,
} from "./types";

async function fetchArtistByUrl(
  provider: Provider,
  artistId?: string,
  artistUrl?: string,
): Promise<SearchResponse> {
  const { data, error } = await supabase.functions.invoke(
    "search-artist-links",
    {
      body: {
        provider,
        ...(artistId && { artistId }),
        ...(artistUrl && { artistUrl }),
      },
    },
  );

  if (error) {
    console.error("Error fetching artist by URL:", error);
    throw new Error("Failed to fetch artist");
  }

  return searchResponseSchema.parse(data);
}

export function useFetchArtistByUrlMutation() {
  return useMutation({
    mutationFn: ({
      provider,
      artistId,
      artistUrl,
    }: {
      provider: Provider;
      artistId?: string;
      artistUrl?: string;
    }) => fetchArtistByUrl(provider, artistId, artistUrl),
  });
}
