import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { setsKeys } from "./types";

interface RawArtistSet {
  id: string;
  name: string;
  description: string | null;
  time_start: string | null;
  time_end: string | null;
  stage_id: string | null;
  stages: { name: string } | null;
  set_artists: Array<{
    artist_id: string;
    artists: { name: string } | null;
    role: string | null;
  }>;
}

export interface ArtistSetWithCoPerformers {
  id: string;
  name: string;
  description: string | null;
  time_start: string | null;
  time_end: string | null;
  stage_id: string | null;
  stage_name?: string | null;
  co_performers: Array<{
    artist_id: string;
    artist_name: string;
    role: string | null;
  }>;
}

async function fetchArtistSetsByEdition(
  artistId: string,
  editionId: string,
): Promise<ArtistSetWithCoPerformers[]> {
  const { data, error } = await supabase
    .from("set_artists")
    .select(
      `
      set_id,
      sets!inner (
        id,
        name,
        description,
        time_start,
        time_end,
        stage_id,
        stages (name),
        set_artists (
          artist_id,
          artists (name),
          role
        )
      )
    `,
    )
    .eq("artist_id", artistId)
    .eq("sets.festival_edition_id", editionId)
    .eq("sets.archived", false)
    .order("time_start", { referencedTable: "sets", ascending: true })
    .returns<Array<{ set_id: string; sets: RawArtistSet }>>();

  if (error) {
    console.error("Error fetching artist sets by edition:", error);
    throw new Error("Failed to fetch artist sets");
  }

  // Transform the data to match expected structure
  const setsMap = new Map<string, ArtistSetWithCoPerformers>();

  data?.forEach((setArtist) => {
    if (!setArtist.sets) return;

    const set = setArtist.sets;
    const setId = set.id;

    if (!setsMap.has(setId)) {
      setsMap.set(setId, {
        id: set.id,
        name: set.name,
        description: set.description,
        time_start: set.time_start,
        time_end: set.time_end,
        stage_id: set.stage_id,
        stage_name: set.stages?.name || null,
        co_performers: [],
      });
    }

    const artistSet = setsMap.get(setId)!;

    // Add all co-performers from this set
    set.set_artists?.forEach((sa) => {
      const coPerformer = {
        artist_id: sa.artist_id,
        artist_name: sa.artists?.name || "Unknown Artist",
        role: sa.role,
      };

      // Avoid duplicates
      if (
        !artistSet.co_performers.some((cp) => cp.artist_id === sa.artist_id)
      ) {
        artistSet.co_performers.push(coPerformer);
      }
    });
  });

  return Array.from(setsMap.values());
}

export function artistSetsByEditionQuery(
  artistId: string | undefined,
  editionId: string | undefined,
) {
  return queryOptions({
    queryKey: setsKeys.byArtistAndEdition(artistId ?? "", editionId ?? ""),
    queryFn: () => fetchArtistSetsByEdition(artistId!, editionId!),
    enabled: !!artistId && !!editionId,
  });
}

export function useArtistSetsByEditionQuery(
  artistId: string | undefined,
  editionId: string | undefined,
) {
  return useQuery({
    ...artistSetsByEditionQuery(artistId, editionId),
    enabled: !!artistId && !!editionId,
  });
}
