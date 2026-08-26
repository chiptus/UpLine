import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { requireCanEditArtists } from "../_shared/auth.ts";
import { searchSoundCloud } from "./soundcloud-adapter.ts";
import { searchSpotify } from "./spotify-adapter.ts";
import type {
  Provider,
  ProviderSearchOutcome,
  SearchRequest,
  SearchResponse,
  SearchResult,
} from "./types.ts";

const searchByProvider: Record<
  Provider,
  (artistNames: string[]) => Promise<Map<string, ProviderSearchOutcome>>
> = {
  soundcloud: searchSoundCloud,
  spotify: searchSpotify,
};

const SearchRequestSchema = z.object({
  artistNames: z.array(z.string()).min(1),
  provider: z.enum(["soundcloud", "spotify"]).optional(),
});

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const auth = await requireCanEditArtists(req);
  if (auth.errorResponse) {
    return new Response(auth.errorResponse.body, {
      status: auth.errorResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    const parsed = SearchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          details: parsed.error.errors,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const request: SearchRequest = parsed.data;
    const providers: Provider[] = request.provider
      ? [request.provider]
      : ["soundcloud", "spotify"];

    const results: SearchResult[] = [];

    for (const provider of providers) {
      console.log(`[search-artist-links] Searching ${provider}...`);

      try {
        const outcomeMap = await searchByProvider[provider](
          request.artistNames,
        );

        for (const artistName of request.artistNames) {
          const outcome = outcomeMap.get(artistName) ?? { candidates: [] };
          results.push({
            artistName,
            provider,
            candidates: outcome.candidates,
            ...(outcome.error && { error: outcome.error }),
          });
        }
      } catch (providerError) {
        console.error(
          `[search-artist-links] Provider ${provider} failed:`,
          providerError,
        );

        const message =
          providerError instanceof Error
            ? providerError.message
            : `${provider} search failed`;

        for (const artistName of request.artistNames) {
          results.push({
            artistName,
            provider,
            candidates: [],
            error: message,
          });
        }
      }
    }

    const response: SearchResponse = { results };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[search-artist-links] Error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
