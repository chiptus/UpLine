import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { artistsKeys } from "./types";

async function bulkArchiveArtists(artistIds: string[]) {
  const { error } = await supabase
    .from("artists")
    .update({ archived: true })
    .in("id", artistIds);

  if (error) {
    console.error("Error bulk archiving artists:", error);
    throw new Error("Failed to archive artists");
  }

  return artistIds;
}

export function useBulkArchiveArtistsMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: bulkArchiveArtists,
    onSuccess: (results) => {
      queryClient.invalidateQueries({
        queryKey: artistsKeys.all,
      });

      toast({
        title: "Bulk Archive Complete",
        description: `Successfully archived ${results.length} artist(s).`,
      });
    },
    onError: (error) => {
      toast({
        title: "Bulk Archive Error",
        description: error?.message || "Failed to archive artists",
        variant: "destructive",
      });
    },
  });
}
