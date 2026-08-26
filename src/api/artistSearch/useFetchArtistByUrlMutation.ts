import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  searchResponseSchema,
  type SearchResponse,
  type Provider,
} from "./types";

interface FetchArtistByUrlParams {
  provider: Provider;
  artistId?: string;
  artistUrl?: string;
}

async function fetchArtistByUrl({
  provider,
  artistId,
  artistUrl,
}: FetchArtistByUrlParams): Promise<SearchResponse> {
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
    mutationFn: fetchArtistByUrl,
  });
}
