import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Festival, festivalsKeys } from "./types";

export async function fetchFestivalBySlug(
  festivalSlug: string,
): Promise<Festival> {
  const { data, error } = await supabase
    .from("festivals")
    .select("*")
    .eq("archived", false)
    .eq("slug", festivalSlug)
    .single();

  if (error) {
    throw new Error("Failed to load festival");
  }

  return data;
}

export function useFestivalBySlugQuery(festivalSlug: string | undefined) {
  return useQuery({
    queryKey: festivalsKeys.bySlug(festivalSlug!),
    queryFn: () => fetchFestivalBySlug(festivalSlug!),
    enabled: !!festivalSlug,
  });
}
