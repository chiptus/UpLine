import { useState, useMemo } from "react";
import type { SetImportData } from "@/services/csv/csvParser";
import type { ArtistSelection } from "./SetsPreviewTable";

export function useArtistSelections({
  sets,
  artistsByName,
}: {
  sets: SetImportData[];
  artistsByName: Map<string, string>;
}) {
  const [overrides, setOverrides] = useState<Map<number, ArtistSelection[]>>(
    new Map(),
  );

  const defaults = useMemo(() => {
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

  const artistSelections = useMemo(
    () => new Map([...defaults, ...overrides]),
    [defaults, overrides],
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
    setOverrides((prev) => new Map(prev).set(setIndex, next));
  }

  return { artistSelections, handleArtistSelectionChange };
}
