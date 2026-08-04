import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { generateSlug, slugCandidate } from "@/lib/slug";
import type { Artist } from "./types";
import { artistsKeys } from "./types";

type ArtistRow = Database["public"]["Tables"]["artists"]["Row"];

const UNIQUE_VIOLATION = "23505";
const MAX_SLUG_ATTEMPTS = 50;

// Mutation function
async function createArtist(
  artistData: Omit<
    Artist,
    | "created_at"
    | "updated_at"
    | "archived"
    | "artist_music_genres"
    | "id"
    | "last_soundcloud_sync"
    | "soundcloud_followers"
    | "votes"
    | "estimated_date"
    | "slug"
    | "stage"
    | "time_end"
    | "time_start"
  > & {
    genre_ids: string[];
  },
): Promise<Artist> {
  const { genre_ids, ...artist } = artistData;
  const baseSlug = generateSlug(artist.name);

  let data: ArtistRow | null = null;

  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
    const result = await supabase
      .from("artists")
      .insert({
        ...artist,
        slug: slugCandidate(baseSlug, attempt),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (result.error) {
      if (result.error.code === UNIQUE_VIOLATION) {
        continue;
      }
      console.error("Error creating artist:", result.error);
      throw new Error("Failed to create artist");
    }

    data = result.data;
    break;
  }

  if (!data) {
    throw new Error("Failed to create artist: could not find a unique slug");
  }

  if (genre_ids.length > 0) {
    const { error: genreError } = await supabase
      .from("artist_music_genres")
      .insert(
        genre_ids.map((genreId) => ({
          artist_id: data.id,
          music_genre_id: genreId,
        })),
      );

    if (genreError) {
      console.error("Error adding genres:", genreError);
      throw new Error("Failed to add genres");
    }
  }

  return {
    ...data,
    artist_music_genres: genre_ids.map((genreId) => ({
      music_genre_id: genreId,
    })),
  };
}

// Hook
export function useCreateArtistMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createArtist,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: artistsKeys.all,
      });
      toast({
        title: "Success",
        description: "Artist created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create artist",
        variant: "destructive",
      });
    },
  });
}
