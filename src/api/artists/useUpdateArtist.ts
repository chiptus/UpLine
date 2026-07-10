import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { generateSlug } from "@/lib/slug";
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
}): Promise<void> {
  const { id, updates } = variables;
  const { genre_ids } = updates;

  const updateData: ArtistUpdate = {};
  if (updates.name !== undefined) {
    updateData.name = updates.name;
    updateData.slug = generateSlug(updates.name);
  }
  if (updates.description !== undefined) {
    updateData.description = updates.description;
  }
  if (updates.estimated_date !== undefined) {
    updateData.estimated_date = updates.estimated_date;
  }
  if (updates.image_url !== undefined) {
    updateData.image_url = updates.image_url;
  }
  if (updates.soundcloud_url !== undefined) {
    updateData.soundcloud_url = updates.soundcloud_url;
  }
  if (updates.spotify_url !== undefined) {
    updateData.spotify_url = updates.spotify_url;
  }
  if (updates.stage !== undefined) {
    updateData.stage = updates.stage;
  }
  if (updates.time_start !== undefined) {
    updateData.time_start = updates.time_start;
  }
  if (updates.time_end !== undefined) {
    updateData.time_end = updates.time_end;
  }
  if (updates.archived !== undefined) {
    updateData.archived = updates.archived;
  }

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase
      .from("artists")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Error updating artist:", error);
      throw new Error("Failed to update artist");
    }
  }

  if (genre_ids !== undefined) {
    const { data: currentGenres, error: currentGenresError } = await supabase
      .from("artist_music_genres")
      .select("music_genre_id")
      .eq("artist_id", id);

    if (currentGenresError) {
      console.error("Error fetching current genres:", currentGenresError);
      throw new Error("Failed to fetch current genres");
    }

    const currentGenreIds = currentGenres.map((g) => g.music_genre_id);

    const genresToAdd = genre_ids.filter(
      (genreId) => !currentGenreIds.includes(genreId),
    );
    const genresToRemove = currentGenreIds.filter(
      (genreId) => !genre_ids.includes(genreId),
    );

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
  }
}

// Hook
export function useUpdateArtistMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: updateArtist,
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: artistsKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: artistsKeys.detail(variables.id),
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
