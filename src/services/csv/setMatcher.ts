import { supabase } from "@/integrations/supabase/client";
import type { SetImportData } from "./csvParser";

export interface MatchingSet {
  id: string;
  name: string;
  stage_name: string | null;
  artist_names: string[];
  vote_count: number;
  time_start: string | null;
}

export async function findMatchingSets({
  existingSets,
  importedSets,
}: {
  importedSets: SetImportData[];
  existingSets: {
    id: string;
    name: string;
    time_start: string | null;
    set_artists?: { artists: { name: string } }[];
    stages?: { name: string } | null;
  }[];
}): Promise<Map<number, MatchingSet[]>> {
  const matchMap = new Map<number, MatchingSet[]>();

  for (let index = 0; index < importedSets.length; index++) {
    const set = importedSets[index];
    const artistNames = set.artist_names
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (artistNames.length === 0) {
      matchMap.set(index, []);
      continue;
    }

    if (!existingSets || existingSets.length === 0) {
      matchMap.set(index, []);
      continue;
    }

    const matches: MatchingSet[] = [];

    for (const existingSet of existingSets) {
      if (!existingSet.set_artists || existingSet.set_artists.length === 0) {
        continue;
      }

      const setArtistNames = existingSet.set_artists
        .map(
          (sa: { artists: { name: string } | null } | null) =>
            sa?.artists?.name,
        )
        .filter((name): name is string => name !== null && name !== undefined);

      function normalizeArtistName(name: string) {
        return name
          .toLowerCase()
          .trim()
          .replace(/[.,;!?]+$/, "");
      }

      const csvArtistNamesLower = artistNames.map(normalizeArtistName);
      const setArtistNamesLower = setArtistNames.map(normalizeArtistName);

      csvArtistNamesLower.sort();
      setArtistNamesLower.sort();

      const artistsMatch =
        setArtistNamesLower.length === csvArtistNamesLower.length &&
        setArtistNamesLower.every(
          (name: string, idx: number) => name === csvArtistNamesLower[idx],
        );

      if (artistsMatch) {
        const { count: voteCount } = await supabase
          .from("votes")
          .select("*", { count: "exact", head: true })
          .eq("set_id", existingSet.id);

        matches.push({
          id: existingSet.id,
          name: existingSet.name,
          stage_name: existingSet.stages?.name || null,
          artist_names: setArtistNames,
          vote_count: voteCount || 0,
          time_start: existingSet.time_start,
        });
      }
    }

    matchMap.set(index, matches);
  }

  return matchMap;
}
