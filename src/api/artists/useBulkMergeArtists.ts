import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Artist } from "./types";
import { artistsKeys } from "./types";
import {
  duplicateArtistsKeys,
  type DuplicateGroup,
} from "./useDuplicateArtists";

export interface BulkMergeParams {
  groups: DuplicateGroup[];
  strategy: "smart" | "first" | "newest" | "oldest";
}

interface MergeProgress {
  total: number;
  completed: number;
  current?: string;
  errors: Array<{ group: string; error: string }>;
}

async function bulkMergeArtists(
  params: BulkMergeParams,
  onProgress?: (progress: MergeProgress) => void,
) {
  const { groups, strategy } = params;
  const progress: MergeProgress = {
    total: groups.length,
    completed: 0,
    errors: [],
  };

  for (const group of groups) {
    try {
      progress.current = group.name;
      onProgress?.(progress);

      const { primaryArtist, mergeData } = getSmartMergeData(group, strategy);
      const duplicateIds = group.artists
        .filter((a) => a.id !== primaryArtist.id)
        .map((a) => a.id);

      await performSingleMerge(primaryArtist.id, duplicateIds, mergeData);

      progress.completed++;
      onProgress?.(progress);
    } catch (error) {
      progress.errors.push({
        group: group.name,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      progress.completed++;
      onProgress?.(progress);
    }
  }

  return progress;
}

function getSmartMergeData(
  group: DuplicateGroup,
  strategy: BulkMergeParams["strategy"],
) {
  let primaryArtist = group.artists[0];

  // Choose primary artist based on strategy
  switch (strategy) {
    case "newest":
      primaryArtist = group.artists.reduce((newest, current) =>
        new Date(current.created_at) > new Date(newest.created_at)
          ? current
          : newest,
      );
      break;
    case "oldest":
      primaryArtist = group.artists.reduce((oldest, current) =>
        new Date(current.created_at) < new Date(oldest.created_at)
          ? current
          : oldest,
      );
      break;
    case "smart":
      // Choose the one with most complete data as the base
      primaryArtist = group.artists.reduce((best, current) => {
        const currentScore = getCompletenessScore(current);
        const bestScore = getCompletenessScore(best);
        return currentScore > bestScore ? current : best;
      });
      break;
    case "first":
    default:
      primaryArtist = group.artists[0];
      break;
  }

  // Smart merge: start with primary artist's data, then enhance with missing data from others
  const mergeData = {
    name: group.name,
    description: smartMergeDescription(primaryArtist, group.artists),
    spotify_url: smartMergeUrl(primaryArtist, group.artists, "spotify_url"),
    soundcloud_url: smartMergeUrl(
      primaryArtist,
      group.artists,
      "soundcloud_url",
    ),
    genreIds: getAllGenres(group.artists),
  };

  return { primaryArtist, mergeData };
}

function getCompletenessScore(artist: Artist): number {
  let score = 0;
  if (artist.description) score += 3;
  if (artist.spotify_url) score += 2;
  if (artist.soundcloud_url) score += 2;
  if (artist.artist_music_genres?.length) score += 1;
  return score;
}

function smartMergeDescription(
  primaryArtist: Artist,
  allArtists: Artist[],
): string | null {
  // If primary artist has description, use it (it was chosen for having most complete data)
  if (primaryArtist.description) {
    return primaryArtist.description;
  }

  // Otherwise, find the best description from any duplicate
  return (
    allArtists
      .map((a) => a.description)
      .filter((a): a is string => Boolean(a))
      .sort((a, b) => b.length - a.length)[0] || null
  );
}

function smartMergeUrl(
  primaryArtist: Artist,
  allArtists: Artist[],
  field: keyof Pick<Artist, "spotify_url" | "soundcloud_url">,
): string | null {
  // If primary artist has this URL, use it
  if (primaryArtist[field]) {
    return primaryArtist[field];
  }

  // Otherwise, find this URL from any duplicate
  return allArtists.map((a) => a[field]).filter(Boolean)[0] || null;
}

function getAllGenres(artists: Artist[]): string[] {
  const allGenres = new Set<string>();
  artists.forEach((artist) => {
    if (artist.artist_music_genres) {
      artist.artist_music_genres.forEach((genre) => {
        allGenres.add(genre.music_genre_id);
      });
    }
  });
  return Array.from(allGenres);
}

async function performSingleMerge(
  primaryArtistId: string,
  duplicateArtistIds: string[],
  mergeData: {
    name: string;
    description: string | null;
    spotify_url: string | null;
    soundcloud_url: string | null;
    genreIds: string[];
  },
) {
  // Update the primary artist with merged data
  const { error: updateError } = await supabase
    .from("artists")
    .update({
      name: mergeData.name,
      description: mergeData.description,
      spotify_url: mergeData.spotify_url,
      soundcloud_url: mergeData.soundcloud_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", primaryArtistId);

  if (updateError) {
    throw new Error(`Failed to update primary artist: ${updateError.message}`);
  }

  // Update genres
  if (mergeData.genreIds.length > 0) {
    const { error: deleteGenresError } = await supabase
      .from("artist_music_genres")
      .delete()
      .eq("artist_id", primaryArtistId);

    if (deleteGenresError) {
      throw new Error(
        `Failed to remove existing genres: ${deleteGenresError.message}`,
      );
    }

    const genreInserts = mergeData.genreIds.map((genreId: string) => ({
      artist_id: primaryArtistId,
      music_genre_id: genreId,
    }));

    const { error: insertGenresError } = await supabase
      .from("artist_music_genres")
      .insert(genreInserts);

    if (insertGenresError) {
      throw new Error(`Failed to add new genres: ${insertGenresError.message}`);
    }
  }

  // Transfer data for each duplicate
  for (const duplicateId of duplicateArtistIds) {
    // Transfer set associations
    const { error: updateSetArtistsError } = await supabase
      .from("set_artists")
      .update({ artist_id: primaryArtistId })
      .eq("artist_id", duplicateId);

    if (updateSetArtistsError && updateSetArtistsError.code === "23505") {
      // Conflict: delete duplicate associations
      await supabase.from("set_artists").delete().eq("artist_id", duplicateId);
    } else if (updateSetArtistsError) {
      throw new Error(
        `Failed to transfer sets: ${updateSetArtistsError.message}`,
      );
    }

    // Transfer notes (ignore if table doesn't exist)
    await supabase
      .from("artist_notes")
      .update({
        artist_id: primaryArtistId,
        updated_at: new Date().toISOString(),
      })
      .eq("artist_id", duplicateId);

    // Delete duplicate artist
    const { error: deleteError } = await supabase
      .from("artists")
      .delete()
      .eq("id", duplicateId);

    if (deleteError) {
      throw new Error(`Failed to delete duplicate: ${deleteError.message}`);
    }
  }
}

export function useBulkMergeArtistsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      params,
      onProgress,
    }: {
      params: BulkMergeParams;
      onProgress?: (progress: MergeProgress) => void;
    }) => bulkMergeArtists(params, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistsKeys.all });
      queryClient.invalidateQueries({ queryKey: duplicateArtistsKeys.all });
    },
  });
}
