import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { candidateSchema, type Provider } from "./types";

const fetchArtistByUrlResponseSchema = z.object({
  candidate: candidateSchema.nullable(),
  error: z.string().optional(),
});
type FetchArtistByUrlResponse = z.infer<typeof fetchArtistByUrlResponseSchema>;

interface FetchArtistByUrlParams {
  provider: Provider;
  url: string;
}

async function fetchArtistByUrl({
  provider,
  url,
}: FetchArtistByUrlParams): Promise<FetchArtistByUrlResponse> {
  const { data, error } = await supabase.functions.invoke(
    "fetch-artist-by-url",
    {
      body: { provider, url },
    },
  );

  if (error) {
    console.error("Error fetching artist by URL:", error);
    throw new Error("Failed to fetch artist");
  }

  return fetchArtistByUrlResponseSchema.parse(data);
}

export function useFetchArtistByUrlMutation() {
  return useMutation({
    mutationFn: fetchArtistByUrl,
  });
}
