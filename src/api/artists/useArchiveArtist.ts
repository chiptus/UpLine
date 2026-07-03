import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { artistsKeys } from "./types";

// Mutation function
async function archiveArtist(artistId: string) {
  const { error } = await supabase
    .from("artists")
    .update({ archived: true })
    .eq("id", artistId);

  if (error) {
    console.error("Error archiving artist:", error);
    throw new Error("Failed to archive artist");
  }

  return true;
}

// Hook
export function useArchiveArtistMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: archiveArtist,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: artistsKeys.all,
      });
      toast({
        title: "Success",
        description: "Artist archived successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to archive artist",
        variant: "destructive",
      });
    },
  });
}
