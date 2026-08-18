import { registerCleanup, testSupabase } from "../harness";

/** Disposable festival + edition pair for tests that just need some valid `festival_edition_id`. */
export async function createScratchFestivalEdition(): Promise<string> {
  const suffix = crypto.randomUUID();

  const { data: festival, error: festivalError } = await testSupabase
    .from("festivals")
    .insert({
      name: `Scratch Festival ${suffix}`,
      slug: `scratch-festival-${suffix}`,
    })
    .select("id")
    .single();
  if (festivalError) throw festivalError;

  // Deleting the festival cascades to its edition and festival_info.
  registerCleanup(async () => {
    const { error } = await testSupabase
      .from("festivals")
      .delete()
      .eq("id", festival.id);
    if (error) throw error;
  });

  const { data: edition, error: editionError } = await testSupabase
    .from("festival_editions")
    .insert({
      festival_id: festival.id,
      name: `Scratch Edition ${suffix}`,
      slug: `scratch-edition-${suffix}`,
      year: 2099,
    })
    .select("id")
    .single();
  if (editionError) throw editionError;

  return edition.id;
}
