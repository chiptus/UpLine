import { useState, useMemo } from "react";
import type { SetImportData } from "@/services/csv/csvParser";
import type { MatchingSet } from "@/services/csv/setMatcher";
import type { SetSelection } from "./SetsPreviewTable";

export function useSetMatchSelections({
  pageSets,
  pageStart,
  matchingSetsData,
}: {
  pageSets: SetImportData[];
  pageStart: number;
  matchingSetsData: Map<number, MatchingSet[]> | undefined;
}) {
  const [overrides, setOverrides] = useState<Map<number, SetSelection>>(
    new Map(),
  );

  const defaults = useMemo(() => {
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

  const setSelections = useMemo(
    () => new Map([...defaults, ...overrides]),
    [defaults, overrides],
  );

  function handleSetSelectionChange(setIndex: number, selection: SetSelection) {
    setOverrides((prev) => new Map(prev).set(setIndex, selection));
  }

  return { setSelections, handleSetSelectionChange };
}
