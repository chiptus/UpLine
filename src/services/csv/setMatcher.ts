import { supabase } from "@/integrations/supabase/client";
import type { SetImportData } from "./csvParser";

export interface MatchingSet {
  id: string;
  name: string;
  stage_name: string | null;
  artist_names: string[];
  vote_count: number;
}

export async function findMatchingSets({
  existingSets,
  importedSets,
}: {
  importedSets: SetImportData[];
  existingSets: {
    id: string;
    name: string;
    set_artists?: { artists: { name: string } }[];
    stages?: { name: string } | null;
  }[];
}): Promise<Map<number, MatchingSet | null>> {
  const matchMap = new Map<number, MatchingSet | null>();

  for (let index = 0; index < importedSets.length; index++) {
    const set = importedSets[index];
    const artistNames = set.artist_names
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (artistNames.length === 0) {
      matchMap.set(index, null);
      continue;
    }

    if (!existingSets || existingSets.length === 0) {
      matchMap.set(index, null);
      continue;
    }

    let bestMatch: MatchingSet | null = null;

    for (const existingSet of existingSets) {
      if (!existingSet.set_artists || existingSet.set_artists.length === 0) {
        continue;
      }

      const setArtistNames = existingSet.set_artists
        .map(
          (sa: { artists: { name: string } | null } | null) =>
            sa?.artists?.name,
        )
        .filter((name): name is string => name !== null && name !== undefined)
        .sort();

      const csvArtistNamesSorted = [...artistNames].sort();

      const artistsMatch =
        setArtistNames.length === csvArtistNamesSorted.length &&
        setArtistNames.every(
          (name: string, idx: number) => name === csvArtistNamesSorted[idx],
        );

      if (artistsMatch) {
        const { count: voteCount } = await supabase
          .from("votes")
          .select("*", { count: "exact", head: true })
          .eq("set_id", existingSet.id);

        bestMatch = {
          id: existingSet.id,
          name: existingSet.name,
          stage_name: existingSet.stages?.name || null,
          artist_names: setArtistNames,
          vote_count: voteCount || 0,
        };
        break;
      }
    }

    if (!bestMatch && set.stage_name) {
      for (const existingSet of existingSets) {
        if (!existingSet.set_artists || existingSet.set_artists.length === 0) {
          continue;
        }

        const stageName = existingSet.stages?.name;
        if (stageName === set.stage_name) {
          const setArtistNames = existingSet.set_artists
            .map(
              (sa: { artists: { name: string } | null } | null) =>
                sa?.artists?.name,
            )
            .filter(
              (name): name is string => name !== null && name !== undefined,
            );

          const { count: voteCount } = await supabase
            .from("votes")
            .select("*", { count: "exact", head: true })
            .eq("set_id", existingSet.id);

          bestMatch = {
            id: existingSet.id,
            name: existingSet.name,
            stage_name: stageName || null,
            artist_names: setArtistNames,
            vote_count: voteCount || 0,
          };
          break;
        }
      }
    }

    matchMap.set(index, bestMatch);
  }

  return matchMap;
}
