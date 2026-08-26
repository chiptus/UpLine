import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { SoundCloudAPIError } from "./errors.ts";
import {
  SoundCloudErrorResponseSchema,
  SoundCloudUserSchema,
} from "./schemas.ts";
import { getSoundCloudAccessToken } from "./auth.ts";
import { normalizeSoundCloudSearchResult } from "../normalize.ts";
import type { ProviderFetchOutcome } from "../types.ts";

export async function fetchSoundCloudAPI<T>(
  endpoint: string,
  accessToken: string,
  schema: z.ZodSchema<T>,
): Promise<T> {
  const fullUrl = `https://api.soundcloud.com${endpoint}`;
  console.log(`[fetchSoundCloudAPI] Making request to: ${fullUrl}`);

  const response = await fetch(fullUrl, {
    headers: {
      Authorization: `OAuth ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "Unable to read error response");

    let userMessage = "Failed to fetch data from SoundCloud";
    let parsedError = null;

    // Try to parse the SoundCloud error response
    try {
      const errorJson = JSON.parse(errorText);
      const soundcloudError =
        SoundCloudErrorResponseSchema.safeParse(errorJson);

      if (soundcloudError.success) {
        parsedError = soundcloudError.data;
        // Use SoundCloud's error message if available
        userMessage = parsedError.message || userMessage;

        // Override with more specific messages based on the code
        if (parsedError.code === 404) {
          userMessage = "Artist or content not found on SoundCloud";
        } else if (parsedError.code === 403) {
          userMessage = "Access denied to SoundCloud content";
        } else if (parsedError.code === 401) {
          userMessage = "SoundCloud authentication failed";
        } else if (parsedError.code >= 500) {
          userMessage = "SoundCloud service temporarily unavailable";
        }
      }
    } catch {
      // If parsing fails, fall back to status code based messages
      if (response.status === 404) {
        userMessage = "Artist or content not found on SoundCloud";
      } else if (response.status === 403) {
        userMessage = "Access denied to SoundCloud content";
      } else if (response.status === 401) {
        userMessage = "SoundCloud authentication failed";
      } else if (response.status >= 500) {
        userMessage = "SoundCloud service temporarily unavailable";
      }
    }

    const errorDetails = {
      status: response.status,
      statusText: response.statusText,
      url: fullUrl,
      endpoint,
      body: errorText,
      parsedError,
    };

    console.error(`[fetchSoundCloudAPI] API Error:`, {
      ...errorDetails,
      soundcloudMessage: parsedError?.message,
      soundcloudCode: parsedError?.code,
      soundcloudErrors: parsedError?.errors?.map((e) => e.error_message),
    });

    throw new SoundCloudAPIError(userMessage, errorDetails);
  }

  const rawData = await response.json();

  const parseResponse = schema.safeParse(rawData);
  console.log(
    `[fetchSoundCloudAPI] Successfully validated response for ${endpoint}`,
  );

  if (!parseResponse.success) {
    console.error(`[fetchSoundCloudAPI] Validation error for ${endpoint}:`, {
      error: parseResponse.error,
      rawData: JSON.stringify(rawData).slice(0, 200) + "...",
    });
    throw new SoundCloudAPIError(
      "SoundCloud returned data in an unexpected format (their API may have changed), see function logs for details",
      {
        status: 200,
        statusText: "OK",
        url: fullUrl,
        endpoint,
        body: `Validation failed: ${parseResponse.error.message}`,
      },
    );
  }

  const data = parseResponse.data;

  console.log(`[fetchSoundCloudAPI] Success for ${endpoint}:`, {
    dataType: Array.isArray(data) ? `array(${data.length})` : typeof data,
    keys:
      typeof data === "object" && data !== null
        ? Object.keys(data as Record<string, unknown>).slice(0, 5)
        : undefined,
  });

  return data;
}

export async function getSoundCloudArtistByUrl(
  artistUrl: string,
): Promise<ProviderFetchOutcome> {
  try {
    const accessToken = await getSoundCloudAccessToken();

    console.log(`[getSoundCloudArtistByUrl] Fetching artist: ${artistUrl}`);

    const endpoint = `/resolve?url=${encodeURIComponent(artistUrl)}&client_id=${encodeURIComponent(Deno.env.get("SOUNDCLOUD_CLIENT_ID") || "")}`;
    const response = await fetchSoundCloudAPI(
      endpoint,
      accessToken,
      SoundCloudUserSchema,
    );

    const candidate = normalizeSoundCloudSearchResult(response);
    console.log(
      `[getSoundCloudArtistByUrl] Found artist: ${response.display_name || response.username}`,
    );
    return { candidate };
  } catch (error) {
    console.error(`[getSoundCloudArtistByUrl] Error fetching artist:`, error);

    if (error instanceof SoundCloudAPIError) {
      return {
        candidate: null,
        error: error.message,
      };
    }

    return {
      candidate: null,
      error:
        error instanceof Error ? error.message : "SoundCloud lookup failed",
    };
  }
}
