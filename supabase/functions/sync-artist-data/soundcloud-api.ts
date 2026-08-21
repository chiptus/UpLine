import { getSoundCloudAccessToken } from "../_shared/soundcloud-api/auth.ts";
import { fetchSoundCloudAPI } from "../_shared/soundcloud-api/api.ts";
import { SoundCloudUserSchema } from "../_shared/soundcloud-api/schemas.ts";
import {
  getArtistPlaylists,
  selectBestPlaylist,
} from "../_shared/soundcloud-api/playlist.ts";
import type {
  SoundCloudPlaylist,
  SoundCloudUser,
} from "../_shared/soundcloud-api/schemas.ts";

export type ArtistData = {
  user: SoundCloudUser;
  topPlaylist: SoundCloudPlaylist | null;
};

export async function getArtistDataFromAPI(
  soundcloudUrl: string,
): Promise<ArtistData> {
  try {
    console.log(`Getting artist data for: ${soundcloudUrl}`);

    const accessToken = await getSoundCloudAccessToken();

    // Resolve the URL to get user info
    const resolveEndpoint = `/resolve?url=${encodeURIComponent(soundcloudUrl)}`;
    const user: SoundCloudUser = await fetchSoundCloudAPI(
      resolveEndpoint,
      accessToken,
      SoundCloudUserSchema,
    );

    console.log(
      `Resolved user: ${user.username} (ID: ${user.id}, followers: ${user.followers_count || 0})`,
    );

    // Try to get playlists first
    const playlists = await getArtistPlaylists(user, accessToken);

    let topPlaylist: SoundCloudPlaylist | null = null;

    if (playlists && playlists.length > 0) {
      const bestPlaylist = selectBestPlaylist(playlists);
      if (bestPlaylist) {
        console.log(`Found best playlist: "${bestPlaylist.title}"`);
        topPlaylist = bestPlaylist;
      }
    }

    if (!topPlaylist) {
      console.log(`No playlists found for ${soundcloudUrl}`);
    }

    return {
      user,
      topPlaylist,
    };
  } catch (error) {
    console.error(`Failed to get artist data for ${soundcloudUrl}:`, error);
    throw error;
  }
}
