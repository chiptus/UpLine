import { registerCleanup, testSupabase } from "../harness";

// Links an artist to a set via the set_artists junction table and
// self-registers cleanup with the harness.
export async function linkArtistToSet(
  setId: string,
  artistId: string,
): Promise<void> {
  const { error } = await testSupabase
    .from("set_artists")
    .insert({ set_id: setId, artist_id: artistId });
  if (error) throw error;

  registerCleanup(async () => {
    const { error: deleteError } = await testSupabase
      .from("set_artists")
      .delete()
      .eq("set_id", setId)
      .eq("artist_id", artistId);
    if (deleteError) throw deleteError;
  });
}
