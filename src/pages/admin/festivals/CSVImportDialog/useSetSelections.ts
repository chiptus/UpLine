import { useState, useMemo } from "react";
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
  const [artistOverrides, setArtistOverrides] = useState<
    Map<number, ArtistSelection[]>
  >(new Map());
  const [setOverrides, setSetOverrides] = useState<Map<number, SetSelection>>(
    new Map(),
  );

  const defaultArtistSelections = useMemo(() => {
    const map = new Map<number, ArtistSelection[]>();
    sets.forEach((set, index) => {
      const artistNames = set.artist_names
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);
      map.set(
        index,
        artistNames.map((csvName) => {
          const artistId = artistsByName.get(csvName.toLowerCase());
          return { csvName, artistId: artistId || null, isCreating: !artistId };
        }),
      );
    });
    return map;
  }, [sets, artistsByName]);

  const defaultSetSelections = useMemo(() => {
    if (!matchingSetsData) return new Map<number, SetSelection>();
    const map = new Map<number, SetSelection>();
    pageSets.forEach((_set, localIndex) => {
      const originalIndex = pageStart + localIndex;
      const matches = matchingSetsData.get(localIndex) || [];
      map.set(
        originalIndex,
        matches.length > 0
          ? { action: "match", matchedSetId: matches[0].id }
          : { action: "create" },
      );
    });
    return map;
  }, [matchingSetsData, pageSets, pageStart]);

  const artistSelections = useMemo(
    () => new Map([...defaultArtistSelections, ...artistOverrides]),
    [defaultArtistSelections, artistOverrides],
  );

  const setSelections = useMemo(
    () => new Map([...defaultSetSelections, ...setOverrides]),
    [defaultSetSelections, setOverrides],
  );

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
    setArtistOverrides((prev) => new Map(prev).set(setIndex, next));
  }

  function handleSetSelectionChange(setIndex: number, selection: SetSelection) {
    setSetOverrides((prev) => new Map(prev).set(setIndex, selection));
  }

  return {
    artistSelections,
    setSelections,
    handleArtistSelectionChange,
    handleSetSelectionChange,
  };
}
