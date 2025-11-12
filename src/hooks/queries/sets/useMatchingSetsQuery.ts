import { useQuery } from "@tanstack/react-query";
import { findMatchingSets } from "@/services/csv/setMatcher";
import type { SetImportData } from "@/services/csv/csvParser";
import { supabase } from "@/integrations/supabase/client";

function useSetsQuery(editionId: string) {
  return useQuery({
    queryKey: ["edition", editionId, "sets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sets")
        .select(
          `
              id,
              name,
              stage_id,
              stages(name),
              set_artists(artist_id, artists(name))
            `,
        )
        .eq("festival_edition_id", editionId)
        .eq("archived", false);

      return data;
    },
  });
}

export function useMatchingSetsQuery(
  importedSets: SetImportData[],
  editionId: string,
  enabled: boolean = true,
) {
  const setsQuery = useSetsQuery(editionId);

  return useQuery({
    queryKey: ["matchingSets", { existingSets: setsQuery.data!, importedSets }],
    queryFn: () =>
      findMatchingSets({ importedSets, existingSets: setsQuery.data! }),
    enabled: enabled && importedSets.length > 0 && !!setsQuery.data,
  });
}
