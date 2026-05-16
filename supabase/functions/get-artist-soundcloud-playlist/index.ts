// might be able to remove this as it's not used

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SoundCloudUserSchema } from "../_shared/soundcloud-api/schemas.ts";
import { getSoundCloudAccessToken } from "../_shared/soundcloud-api/auth.ts";
import { fetchSoundCloudAPI } from "../_shared/soundcloud-api/api.ts";
import {
  getArtistPlaylists,
  getArtistTracks,
  createVirtualPlaylistFromTracks,
  selectBestPlaylist,
} from "../_shared/soundcloud-api/playlist.ts";
import {
  getErrorContext,
  determineErrorResponse,
} from "../_shared/soundcloud-api/errors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url: soundcloudUrl } = await req.json();
    if (!soundcloudUrl) {
      return new Response(
        JSON.stringify({ error: "Missing soundcloud URL parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get SoundCloud credentials from environment
    const clientId = Deno.env.get("SOUNDCLOUD_CLIENT_ID");
    const clientSecret = Deno.env.get("SOUNDCLOUD_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "SoundCloud credentials not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Getting SoundCloud access token...");
    const accessToken = await getSoundCloudAccessToken(clientId, clientSecret);

    console.log("Resolving SoundCloud URL:", soundcloudUrl);
    // First resolve the URL to get user info
    const resolveEndpoint = `/resolve?url=${encodeURIComponent(soundcloudUrl)}`;
    const resolvedUser = await fetchSoundCloudAPI(
      resolveEndpoint,
      accessToken,
      SoundCloudUserSchema,
    );

    if (!resolvedUser || !resolvedUser.id) {
      return new Response(
        JSON.stringify({ error: "Could not resolve SoundCloud user" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(
      `Resolved user: ${resolvedUser.username} (ID: ${resolvedUser.id})`,
    );

    // Try to get playlists first
    const playlists = await getArtistPlaylists(resolvedUser, accessToken);

    if (!playlists || playlists.length === 0) {
      // Fallback: get user's tracks instead
      const tracks = await getArtistTracks(resolvedUser, accessToken);

      if (tracks && tracks.length > 0) {
        // Return a virtual playlist from user's tracks
        const virtualPlaylist = createVirtualPlaylistFromTracks(
          resolvedUser,
          tracks,
        );
        return new Response(JSON.stringify({ playlist: virtualPlaylist }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          error: "No playlists or tracks found for this artist",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Select the best playlist
    const bestPlaylist = selectBestPlaylist(playlists);

    if (!bestPlaylist) {
      return new Response(
        JSON.stringify({ error: "No suitable playlist found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(
      `Returning best playlist: ${bestPlaylist.title} (${bestPlaylist.track_count} tracks)`,
    );

    return new Response(JSON.stringify({ playlist: bestPlaylist }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorContext = getErrorContext(error);
    console.error(
      "Error in get-artist-soundcloud-playlist function:",
      errorContext,
    );

    const { userMessage, statusCode, errorCode } =
      determineErrorResponse(error);

    return new Response(
      JSON.stringify({
        error: userMessage,
        code: errorCode,
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
