import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { artistsKeys } from "./types";
import { duplicateArtistsKeys } from "./useDuplicateArtists";

export interface MergeArtistsParams {
  primaryArtistId: string;
  duplicateArtistIds: string[];
  mergeData: {
    name: string;
    description: string | null;
    spotify_url: string | null;
    soundcloud_url: string | null;
    genreIds: string[];
  };
}

async function mergeArtists(params: MergeArtistsParams) {
  const { primaryArtistId, duplicateArtistIds, mergeData } = params;

  // Start a transaction by using the Supabase client
  try {
    // 1. Update the primary artist with merged data
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
      throw new Error(
        `Failed to update primary artist: ${updateError.message}`,
      );
    }

    // 2. Update artist genres for primary artist
    if (mergeData.genreIds.length > 0) {
      // Remove existing genre associations
      const { error: deleteGenresError } = await supabase
        .from("artist_music_genres")
        .delete()
        .eq("artist_id", primaryArtistId);

      if (deleteGenresError) {
        throw new Error(
          `Failed to remove existing genres: ${deleteGenresError.message}`,
        );
      }

      // Add new genre associations
      const genreInserts = mergeData.genreIds.map((genreId) => ({
        artist_id: primaryArtistId,
        music_genre_id: genreId,
      }));

      const { error: insertGenresError } = await supabase
        .from("artist_music_genres")
        .insert(genreInserts);

      if (insertGenresError) {
        throw new Error(
          `Failed to add new genres: ${insertGenresError.message}`,
        );
      }
    }

    // 3. For each duplicate artist, transfer data and delete
    for (const duplicateId of duplicateArtistIds) {
      // Update set_artists junction table to point duplicate artist's sets to primary artist
      const { error: updateSetArtistsError } = await supabase
        .from("set_artists")
        .update({
          artist_id: primaryArtistId,
        })
        .eq("artist_id", duplicateId);

      if (updateSetArtistsError) {
        // If there's a conflict (primary artist already linked to same set), delete the duplicate entry
        if (updateSetArtistsError.code === "23505") {
          // unique constraint violation
          const { error: deleteConflictError } = await supabase
            .from("set_artists")
            .delete()
            .eq("artist_id", duplicateId);

          if (deleteConflictError) {
            throw new Error(
              `Failed to resolve set conflicts: ${deleteConflictError.message}`,
            );
          }
        } else {
          throw new Error(
            `Failed to transfer set associations: ${updateSetArtistsError.message}`,
          );
        }
      }

      // Transfer artist notes (if this table exists)
      const { error: updateNotesError } = await supabase
        .from("artist_notes")
        .update({
          artist_id: primaryArtistId,
          updated_at: new Date().toISOString(),
        })
        .eq("artist_id", duplicateId);

      // Ignore error if artist_notes table doesn't exist
      if (
        updateNotesError &&
        !updateNotesError.message.includes("does not exist")
      ) {
        throw new Error(
          `Failed to transfer notes: ${updateNotesError.message}`,
        );
      }

      // Delete the duplicate artist (this will cascade to related data)
      const { error: deleteError } = await supabase
        .from("artists")
        .delete()
        .eq("id", duplicateId);

      if (deleteError) {
        throw new Error(
          `Failed to delete duplicate artist: ${deleteError.message}`,
        );
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error merging artists:", error);
    throw error;
  }
}

export function useMergeArtistsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mergeArtists,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistsKeys.all });
      queryClient.invalidateQueries({ queryKey: duplicateArtistsKeys.all });
    },
    onError: (error) => {
      console.error("Merge artists mutation error:", error);
    },
  });
}
