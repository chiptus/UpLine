import { useQuery } from "@tanstack/react-query";
import { findMatchingSets } from "@/services/csv/setMatcher";
import type { SetImportData } from "@/services/csv/csvParser";

export function useMatchingSetsQuery(
  sets: SetImportData[],
  editionId: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["matchingSets", editionId, sets],
    queryFn: () => findMatchingSets(sets, editionId),
    enabled: enabled && sets.length > 0 && !!editionId,
  });
}
