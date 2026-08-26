import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { requireCanEditArtists } from "../_shared/auth.ts";
import {
  extractSpotifyArtistId,
  getSpotifyArtistById,
} from "../_shared/spotify-api/api.ts";
import { getSoundCloudArtistByUrl } from "../_shared/soundcloud-api/api.ts";
import type { ProviderFetchOutcome } from "../_shared/types.ts";

function isValidSoundCloudUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.endsWith("soundcloud.com") &&
      /^\/[^/]+$/.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

const FetchArtistByUrlRequestSchema = z
  .object({
    provider: z.enum(["spotify", "soundcloud"]),
    url: z.string(),
  })
  .superRefine((value, ctx) => {
    const isValidUrl =
      value.provider === "spotify"
        ? extractSpotifyArtistId(value.url) !== null
        : isValidSoundCloudUrl(value.url);

    if (!isValidUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: `Invalid ${value.provider} artist URL`,
      });
    }
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

    let outcome: ProviderFetchOutcome;

    if (provider === "spotify") {
      const artistId = extractSpotifyArtistId(url);
      if (!artistId) {
        outcome = { candidate: null, error: "Invalid Spotify artist URL" };
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

    return new Response(JSON.stringify(outcome), {
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
