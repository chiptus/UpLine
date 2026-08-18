import { registerCleanup, testSupabase } from "../harness";

// Links an artist to a set via the set_artists junction table, returning
// the created row's id, and self-registers cleanup with the harness.
export async function linkArtistToSet(
  setId: string,
  artistId: string,
): Promise<string> {
  const { data, error } = await testSupabase
    .from("set_artists")
    .insert({ set_id: setId, artist_id: artistId })
    .select("id")
    .single();
  if (error) throw error;

  registerCleanup(async () => {
    const { error: deleteError } = await testSupabase
      .from("set_artists")
      .delete()
      .eq("id", data.id);
    if (deleteError) throw deleteError;
  });

  return data.id;
}
