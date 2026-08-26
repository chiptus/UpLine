import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import {
  extractSpotifyArtistId,
  getSpotifyArtistById,
} from "../_shared/spotify-api/api.ts";
import { getSoundCloudArtistByUrl } from "../_shared/soundcloud-api/api.ts";
import type { Candidate, ProviderSearchOutcome } from "../_shared/types.ts";

const FetchArtistByUrlRequestSchema = z.object({
  provider: z.enum(["spotify", "soundcloud"]),
  url: z.string(),
});

interface FetchArtistByUrlResponse {
  candidate: Candidate | null;
  error?: string;
}

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

    const parsed = FetchArtistByUrlRequestSchema.safeParse(body);
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

    const { provider, url } = parsed.data;

    let outcome: ProviderSearchOutcome;

    if (provider === "spotify") {
      const artistId = extractSpotifyArtistId(url);
      if (!artistId) {
        outcome = { candidates: [], error: "Invalid Spotify artist URL" };
      } else {
        console.log(
          `[fetch-artist-by-url] Fetching Spotify artist by ID: ${artistId}`,
        );
        outcome = await getSpotifyArtistById(artistId);
      }
    } else {
      console.log(
        `[fetch-artist-by-url] Fetching SoundCloud artist by URL: ${url}`,
      );
      outcome = await getSoundCloudArtistByUrl(url);
    }

    const response: FetchArtistByUrlResponse = {
      candidate: outcome.candidates[0] ?? null,
      ...(outcome.error && { error: outcome.error }),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[fetch-artist-by-url] Error:", error);

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
