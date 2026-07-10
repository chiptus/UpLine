import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { generateSlug } from "@/lib/slug";
import type { Artist } from "./types";
import { artistsKeys } from "./types";

type ArtistUpdate = Database["public"]["Tables"]["artists"]["Update"];

export type UpdateArtistUpdates = Partial<
  Pick<
    ArtistUpdate,
    | "name"
    | "description"
    | "estimated_date"
    | "image_url"
    | "soundcloud_url"
    | "spotify_url"
    | "stage"
    | "time_start"
    | "time_end"
    | "archived"
  >
> & { genre_ids?: string[] };

// Mutation function
async function updateArtist(variables: {
  id: string;
  updates: UpdateArtistUpdates;
}): Promise<Omit<Artist, "votes">> {
  const { id, updates } = variables;
  const { genre_ids } = updates;

  const updateData: ArtistUpdate = {
    name: updates.name,
    description: updates.description,
    estimated_date: updates.estimated_date,
    image_url: updates.image_url,
    soundcloud_url: updates.soundcloud_url,
    spotify_url: updates.spotify_url,
    stage: updates.stage,
    time_start: updates.time_start,
    time_end: updates.time_end,
    archived: updates.archived,
  };
  if (updates.name !== undefined) {
    updateData.slug = generateSlug(updates.name);
  }

  const { data, error } = await supabase
    .from("artists")
    .update(updateData)
    .eq("id", id)
    .select(
      `
      *,
      artist_music_genres (music_genre_id)
    `,
    )
    .single();

  if (error) {
    console.error("Error updating artist:", error);
    throw new Error("Failed to update artist");
  }

  // Handle genre updates if provided
  if (genre_ids !== undefined) {
    // Get current genre IDs from the fetched data
    const currentGenreIds =
      data.artist_music_genres?.map((g) => g.music_genre_id) || [];

    // Calculate differences
    const genresToAdd = genre_ids.filter(
      (genreId) => !currentGenreIds.includes(genreId),
    );
    const genresToRemove = currentGenreIds.filter(
      (genreId) => !genre_ids.includes(genreId),
    );

    // Remove genres that are no longer selected
    if (genresToRemove.length > 0) {
      const { error: removeError } = await supabase
        .from("artist_music_genres")
        .delete()
        .eq("artist_id", id)
        .in("music_genre_id", genresToRemove);

      if (removeError) {
        console.error("Error removing genres:", removeError);
        throw new Error("Failed to remove genres");
      }
    }

    // Add new genres
    if (genresToAdd.length > 0) {
      const genreInserts = genresToAdd.map((genreId) => ({
        artist_id: id,
        music_genre_id: genreId,
      }));

      const { error: addError } = await supabase
        .from("artist_music_genres")
        .insert(genreInserts);

      if (addError) {
        console.error("Error adding genres:", addError);
        throw new Error("Failed to add genres");
      }
    }

    // Only re-fetch if we made changes
    if (genresToAdd.length > 0 || genresToRemove.length > 0) {
      const { data: updatedData, error: fetchError } = await supabase
        .from("artists")
        .select(
          `
          *,
          artist_music_genres (music_genre_id)
        `,
        )
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("Error fetching updated artist:", fetchError);
        throw new Error("Failed to fetch updated artist");
      }

      return {
        ...updatedData,
        artist_music_genres: updatedData.artist_music_genres,
      };
    }
  }

  return {
    ...data,
    artist_music_genres: data.artist_music_genres,
  };
}

// Hook
export function useUpdateArtistMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: updateArtist,
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: artistsKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: artistsKeys.detail(data.id),
        }),
      ]);

      toast({
        title: "Success",
        description: "Artist updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update artist",
        variant: "destructive",
      });
    },
  });
}
