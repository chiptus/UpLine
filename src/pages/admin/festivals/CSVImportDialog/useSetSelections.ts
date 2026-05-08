import { useState, useEffect } from "react";
import type { SetImportData } from "@/services/csv/csvParser";
import type { MatchingSet } from "@/services/csv/setMatcher";
import type { ArtistSelection, SetSelection } from "./SetsPreviewTable";

export function useSetSelections({
  sets,
  pageSets,
  pageStart,
  artistsByName,
  matchingSetsData,
}: {
  sets: SetImportData[];
  pageSets: SetImportData[];
  pageStart: number;
  artistsByName: Map<string, string>;
  matchingSetsData: Map<number, MatchingSet[]> | undefined;
}) {
  const [artistSelections, setArtistSelections] = useState<
    Map<number, ArtistSelection[]>
  >(new Map());
  const [setSelections, setSetSelections] = useState<Map<number, SetSelection>>(
    new Map(),
  );

  useEffect(() => {
    const updated = new Map<number, ArtistSelection[]>(artistSelections);

    sets.forEach((set, index) => {
      if (updated.has(index)) return;

      const artistNames = set.artist_names
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);

      updated.set(
        index,
        artistNames.map((csvName) => {
          const artistId = artistsByName.get(csvName.toLowerCase());
          return { csvName, artistId: artistId || null, isCreating: !artistId };
        }),
      );
    });

    setArtistSelections(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sets, artistsByName]);

  useEffect(() => {
    if (!matchingSetsData) return;

    const updated = new Map<number, SetSelection>(setSelections);

    pageSets.forEach((_set, localIndex) => {
      const originalIndex = pageStart + localIndex;
      if (updated.has(originalIndex)) return;

      const matches = matchingSetsData.get(localIndex) || [];
      updated.set(
        originalIndex,
        matches.length > 0
          ? { action: "match", matchedSetId: matches[0].id }
          : { action: "create" },
      );
    });

    setSetSelections(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchingSetsData, pageStart]);

  function handleArtistSelectionChange(
    setIndex: number,
    artistIndex: number,
    value: string,
  ) {
    const current = artistSelections.get(setIndex) || [];
    const next = [...current];
    const sel = next[artistIndex];
    next[artistIndex] =
      value === "create"
        ? { ...sel, artistId: null, isCreating: true }
        : { ...sel, artistId: value, isCreating: false };
    const newMap = new Map(artistSelections);
    newMap.set(setIndex, next);
    setArtistSelections(newMap);
  }

  function handleSetSelectionChange(setIndex: number, selection: SetSelection) {
    const newMap = new Map(setSelections);
    newMap.set(setIndex, selection);
    setSetSelections(newMap);
  }

  return {
    artistSelections,
    setSelections,
    handleArtistSelectionChange,
    handleSetSelectionChange,
  };
}
