import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SetNote, artistNotesKeys } from "./types";

async function fetchArtistNotes(artistId: string): Promise<SetNote[]> {
  const { data: notesData, error: notesError } = await supabase
    .from("artist_notes")
    .select("*")
    .eq("artist_id", artistId)
    .order("created_at", { ascending: false });

  if (notesError) {
    throw new Error("Failed to fetch notes");
  }

  // Get author profiles for all notes
  const userIds = notesData?.map((note) => note.user_id) || [];
  if (userIds.length === 0) return [];

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, email")
    .in("id", userIds);

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
  }

  const notesWithAuthor =
    notesData?.map(({ artist_id, ...note }) => {
      const profile = profilesData?.find((p) => p.id === note.user_id);
      return {
        ...note,
        set_id: artist_id,
        author_username: profile?.username || undefined,
        author_email: profile?.email || undefined,
      };
    }) || [];

  return notesWithAuthor;
}

export function artistNotesQuery(artistId: string) {
  return queryOptions({
    queryKey: artistNotesKeys.notes(artistId),
    queryFn: () => fetchArtistNotes(artistId),
  });
}

export function useArtistNotesQuery(artistId: string) {
  return useQuery({
    ...artistNotesQuery(artistId),
    enabled: !!artistId,
  });
}
