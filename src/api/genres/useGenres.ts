import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Genre, genresKeys } from "./types";

export async function fetchGenres(): Promise<Genre[]> {
  const { data, error } = await supabase
    .from("music_genres")
    .select("id, name")
    .order("name");

  if (error) {
    throw new Error("Failed to load genres");
  }

  return data || [];
}

export function genresQuery() {
  return queryOptions({
    queryKey: genresKeys.all(),
    queryFn: fetchGenres,
    staleTime: 10 * 60 * 1000,
  });
}

export function useGenresQuery() {
  return useQuery(genresQuery());
}
