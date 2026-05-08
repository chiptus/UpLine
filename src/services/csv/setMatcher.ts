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

function normalizeArtistName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[.,;!?]+$/, "");
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

  // First pass: pure JS matching, no DB calls
  const pendingMatches: Array<{
    importedIndex: number;
    existingSet: (typeof existingSets)[0];
    setArtistNames: string[];
  }> = [];

  for (let index = 0; index < importedSets.length; index++) {
    const set = importedSets[index];
    const artistNames = set.artist_names
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    matchMap.set(index, []);

    if (
      artistNames.length === 0 ||
      !existingSets ||
      existingSets.length === 0
    ) {
      continue;
    }

    const csvArtistNamesLower = artistNames.map(normalizeArtistName).sort();

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

      const setArtistNamesLower = setArtistNames
        .map(normalizeArtistName)
        .sort();

      const artistsMatch =
        setArtistNamesLower.length === csvArtistNamesLower.length &&
        setArtistNamesLower.every(
          (name: string, idx: number) => name === csvArtistNamesLower[idx],
        );

      if (artistsMatch) {
        pendingMatches.push({
          importedIndex: index,
          existingSet,
          setArtistNames,
        });
      }
    }
  }

  if (pendingMatches.length === 0) {
    return matchMap;
  }

  // Batch fetch vote counts for all matched sets in one query
  const matchedSetIds = [
    ...new Set(pendingMatches.map((m) => m.existingSet.id)),
  ];
  const { data: votes } = await supabase
    .from("votes")
    .select("set_id")
    .in("set_id", matchedSetIds);

  const voteCountMap = new Map<string, number>();
  votes?.forEach((v) => {
    voteCountMap.set(v.set_id, (voteCountMap.get(v.set_id) || 0) + 1);
  });

  // Second pass: build match map with pre-fetched vote counts
  for (const { importedIndex, existingSet, setArtistNames } of pendingMatches) {
    const existing = matchMap.get(importedIndex) ?? [];
    existing.push({
      id: existingSet.id,
      name: existingSet.name,
      stage_name: existingSet.stages?.name || null,
      artist_names: setArtistNames,
      vote_count: voteCountMap.get(existingSet.id) || 0,
      time_start: existingSet.time_start,
    });
    matchMap.set(importedIndex, existing);
  }

  return matchMap;
}
