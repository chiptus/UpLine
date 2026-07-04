import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Artist } from "./types";

export type DuplicateGroup = {
  name: string;
  count: number;
  artists: Artist[];
};

export const duplicateArtistsKeys = {
  all: ["duplicateArtists"] as const,
  groups: () => [...duplicateArtistsKeys.all, "groups"] as const,
};

async function fetchDuplicateArtists(): Promise<DuplicateGroup[]> {
  const { data: duplicateNames, error: duplicateError } = await supabase
    .from("artists")
    .select("name")
    .eq("archived", false)
    .order("name");

  if (duplicateError) {
    console.error("Error fetching duplicate names:", duplicateError);
    throw new Error("Failed to fetch duplicate artists");
  }

  const nameCounts = duplicateNames.reduce(
    (acc, artist) => {
      acc[artist.name.toLocaleLowerCase()] =
        (acc[artist.name.toLocaleLowerCase()] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const duplicateNamesList = Object.entries(nameCounts)
    .filter(([_, count]) => count > 1)
    .map(([name, count]) => ({ name, count }));

  if (duplicateNamesList.length === 0) {
    return [];
  }

  const duplicateGroups: DuplicateGroup[] = [];

  for (const { name, count } of duplicateNamesList) {
    const { data: artists, error } = await supabase
      .from("artists")
      .select(
        `
        *,
        artist_music_genres (music_genre_id)
      `,
      )
      .ilike("name", name)
      .eq("archived", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`Error fetching artists for ${name}:`, error);
      continue;
    }

    if (artists && artists.length > 1) {
      duplicateGroups.push({
        name,
        count,
        artists: artists as Artist[],
      });
    }
  }

  return duplicateGroups.sort((a, b) => b.count - a.count);
}

export function duplicateArtistsQuery() {
  return queryOptions({
    queryKey: duplicateArtistsKeys.groups(),
    queryFn: fetchDuplicateArtists,
  });
}

export function useDuplicateArtistsQuery() {
  return useQuery(duplicateArtistsQuery());
}
