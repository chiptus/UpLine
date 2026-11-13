import { supabase } from "@/integrations/supabase/client";

/** Artist slugs are globally unique. */
export async function isArtistSlugTaken(params: {
  slug: string;
  excludeArtistId: string;
}): Promise<boolean> {
  const { data, error } = await supabase
    .from("artists")
    .select("id")
    .eq("slug", params.slug)
    .neq("id", params.excludeArtistId)
    .limit(1);

  if (error) {
    console.error("Error checking artist slug:", error);
    throw new Error("Failed to check slug availability");
  }

  return data.length > 0;
}
