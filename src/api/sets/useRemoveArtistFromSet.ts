import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { setsKeys } from "./types";

// Mutation function
async function removeArtistFromSet(variables: {
  setId: string;
  artistId: string;
}): Promise<void> {
  const { setId, artistId } = variables;

  const { error } = await supabase
    .from("set_artists")
    .delete()
    .eq("set_id", setId)
    .eq("artist_id", artistId);

  if (error) {
    console.error("Error removing artist from set:", error);
    throw new Error("Failed to remove artist from set");
  }
}

// Hook
export function useRemoveArtistFromSetMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: removeArtistFromSet,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: setsKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: setsKeys.detail(variables.setId),
      });
      toast({
        title: "Success",
        description: "Artist removed from set successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to remove artist from set",
        variant: "destructive",
      });
    },
  });
}
