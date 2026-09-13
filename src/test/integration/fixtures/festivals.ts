import type { Database } from "@/integrations/supabase/types";
import { registerCleanup, testSupabase } from "../harness";

type Festival = Database["public"]["Tables"]["festivals"]["Row"];
type FestivalInsert = Database["public"]["Tables"]["festivals"]["Insert"];

/** Creates a uniquely-named, uniquely-slugged festival and self-registers its cleanup. */
export async function createFestival(
  overrides: Partial<FestivalInsert> = {},
): Promise<Festival> {
  const suffix = crypto.randomUUID();

  const { data, error } = await testSupabase
    .from("festivals")
    .insert({
      name: `Scratch Festival ${suffix}`,
      slug: `scratch-festival-${suffix}`,
      ...overrides,
    })
    .select("*")
    .single();
  if (error) throw error;

  registerCleanup(async () => {
    const { error: deleteError } = await testSupabase
      .from("festivals")
      .delete()
      .eq("id", data.id);
    if (deleteError) throw deleteError;
  });

  return data;
}
