import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import {
  searchSoundCloud,
  getSoundCloudArtistByUrl,
} from "./soundcloud-adapter.ts";
import { searchSpotify, getSpotifyArtistById } from "./spotify-adapter.ts";
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
  artistNames: z.array(z.string()).min(1).optional(),
  provider: z.enum(["soundcloud", "spotify"]).optional(),
  artistId: z.string().optional(),
  artistUrl: z.string().optional(),
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
    const results: SearchResult[] = [];

    if (request.artistId || request.artistUrl) {
      console.log("[search-artist-links] URL/ID-based lookup mode");

      if (!request.provider) {
        return new Response(
          JSON.stringify({
            error: "Invalid request",
            details: ["provider is required for URL/ID-based lookup"],
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      try {
        let outcome: ProviderSearchOutcome;

        if (request.provider === "spotify" && request.artistId) {
          console.log(
            `[search-artist-links] Fetching Spotify artist by ID: ${request.artistId}`,
          );
          outcome = await getSpotifyArtistById(request.artistId);
        } else if (request.provider === "soundcloud" && request.artistUrl) {
          console.log(
            `[search-artist-links] Fetching SoundCloud artist by URL: ${request.artistUrl}`,
          );
          outcome = await getSoundCloudArtistByUrl(request.artistUrl);
        } else {
          return new Response(
            JSON.stringify({
              error: "Invalid request",
              details: [
                `${request.provider} lookup requires ${request.provider === "spotify" ? "artistId" : "artistUrl"}`,
              ],
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        results.push({
          artistName: "",
          provider: request.provider,
          candidates: outcome.candidates,
          ...(outcome.error && { error: outcome.error }),
        });
      } catch (providerError) {
        console.error(
          `[search-artist-links] Provider ${request.provider} lookup failed:`,
          providerError,
        );

        const message =
          providerError instanceof Error
            ? providerError.message
            : `${request.provider} lookup failed`;

        results.push({
          artistName: "",
          provider: request.provider,
          candidates: [],
          error: message,
        });
      }
    } else if (request.artistNames && request.artistNames.length > 0) {
      console.log("[search-artist-links] Name-based search mode");

      const providers: Provider[] = request.provider
        ? [request.provider]
        : ["soundcloud", "spotify"];

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
    } else {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          details: [
            "Either artistNames or (artistId/artistUrl) must be provided",
          ],
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
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
