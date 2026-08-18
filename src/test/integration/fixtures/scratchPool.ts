import { registerCleanup, testSupabase } from "../harness";

// A disposable festival + edition pair for tests that need *some* valid
// festival_edition_id but don't care which one — so callers of createSet
// aren't forced to build the festivals -> festival_editions chain by hand.
// Every call creates its own uniquely-named row and self-registers cleanup,
// same as the other fixture factories, so concurrent callers never share
// (or race over) the same edition.
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

  // Deleting the festival cascades to its edition (and festival_info), so
  // one cleanup covers both rows this function creates.
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
