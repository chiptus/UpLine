import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

// Enhanced error class that includes error codes
export class SoundCloudError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = "UNKNOWN_ERROR") {
    super(message);
    this.name = "SoundCloudError";
    this.code = code;
  }
}

// Type guard for SoundCloudError
export function isSoundCloudError(error: unknown): error is SoundCloudError {
  return error instanceof SoundCloudError;
}

// SoundCloud API response types
interface SoundCloudUser {
  id: number;
  username: string;
  permalink_url: string;
}

interface SoundCloudPlaylist {
  id: number;
  title: string;
  description: string | null;
  permalink_url: string;
  artwork_url: string | null;
  user: SoundCloudUser;
  track_count: number;
  tracks?: SoundCloudTrack[];
  likes_count?: number;
  reposts_count?: number;
  created_at: string;
}

interface SoundCloudTrack {
  id: number;
  title: string;
  permalink_url: string;
  stream_url?: string;
  duration: number;
  artwork_url: string | null;
}

interface UseArtistSoundcloudPlaylistOptions {
  soundcloudUrl: string;
  enabled?: boolean;
}

async function fetchArtistPlaylist(
  soundcloudUrl: string,
): Promise<SoundCloudPlaylist> {
  const { data, error } = await supabase.functions.invoke(
    "get-artist-soundcloud-playlist",
    {
      body: { url: soundcloudUrl },
    },
  );

  if (error) {
    console.error("[fetchArtistPlaylist] Edge function error:", error);

    // Handle FunctionsHttpError to get the actual error details
    if (!(error instanceof FunctionsHttpError)) {
      throw error;
    }

    let soundcloudError: SoundCloudError | null = null;
    try {
      const errorDetails = await error.context.json();
      console.error(
        "[fetchArtistPlaylist] Function returned error:",
        errorDetails,
      );

      // Use the specific error message and code from our edge function
      const message =
        errorDetails.error || "Failed to fetch SoundCloud playlist";
      const errorCode = errorDetails.code || "UNKNOWN_ERROR";

      soundcloudError = new SoundCloudError(message, errorCode);
    } catch (parseError) {
      console.error(
        "[fetchArtistPlaylist] Failed to parse error response:",
        parseError,
      );
      throw new Error("Failed to fetch SoundCloud playlist");
    }

    if (soundcloudError) {
      throw soundcloudError;
    }
  }

  if (!data?.playlist) {
    console.error("[fetchArtistPlaylist] No playlist in response:", data);
    throw new Error("No playlist found in response");
  }

  return data.playlist;
}

export function useArtistSoundcloudPlaylist({
  soundcloudUrl,
  enabled = true,
}: UseArtistSoundcloudPlaylistOptions) {
  return useQuery({
    queryKey: ["soundcloud-playlist", soundcloudUrl],
    queryFn: () => fetchArtistPlaylist(soundcloudUrl),
    enabled: enabled && Boolean(soundcloudUrl),
    retry(failureCount, error) {
      if (isSoundCloudError(error)) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
