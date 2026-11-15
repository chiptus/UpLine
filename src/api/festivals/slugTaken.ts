import { supabase } from "@/integrations/supabase/client";

/** Slug is globally unique across festivals. */
export async function isFestivalSlugTaken(
  slug: string,
  excludeFestivalId: string,
  signal?: AbortSignal,
): Promise<boolean> {
  const query = supabase
    .from("festivals")
    .select("id")
    .eq("slug", slug)
    .neq("id", excludeFestivalId)
    .limit(1);
  const { data, error } = await (signal ? query.abortSignal(signal) : query);

  if (error) throw error;
  return data.length > 0;
}

/** Edition slugs only need to be unique within their festival. */
export async function isEditionSlugTaken(
  slug: string,
  festivalId: string,
  excludeEditionId: string,
  signal?: AbortSignal,
): Promise<boolean> {
  const query = supabase
    .from("festival_editions")
    .select("id")
    .eq("slug", slug)
    .eq("festival_id", festivalId)
    .neq("id", excludeEditionId)
    .limit(1);
  const { data, error } = await (signal ? query.abortSignal(signal) : query);

  if (error) throw error;
  return data.length > 0;
}
