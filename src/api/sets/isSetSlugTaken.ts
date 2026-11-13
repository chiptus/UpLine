import { supabase } from "@/integrations/supabase/client";

/** Sets are unique per edition, so the check is scoped to it. */
export async function isSetSlugTaken(params: {
  editionId: string;
  slug: string;
  excludeSetId: string;
}): Promise<boolean> {
  const { data, error } = await supabase
    .from("sets")
    .select("id")
    .eq("festival_edition_id", params.editionId)
    .eq("slug", params.slug)
    .neq("id", params.excludeSetId)
    .limit(1);

  if (error) {
    console.error("Error checking set slug:", error);
    throw new Error("Failed to check slug availability");
  }

  return data.length > 0;
}
