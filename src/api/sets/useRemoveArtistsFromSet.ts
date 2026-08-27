import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { setsKeys } from "./types";

// Mutation function
async function removeArtistsFromSet(variables: {
  setId: string;
  artistIds: string[];
}): Promise<void> {
  const { setId, artistIds } = variables;

  const { error } = await supabase
    .from("set_artists")
    .delete()
    .eq("set_id", setId)
    .in("artist_id", artistIds);

  if (error) {
    console.error("Error removing artists from set:", error);
    throw new Error("Failed to remove artists from set");
  }
}

// Hook
export function useRemoveArtistsFromSetMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: removeArtistsFromSet,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: setsKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: setsKeys.detail(variables.setId),
      });
      toast({
        title: "Success",
        description: "Artists removed from set successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to remove artists from set",
        variant: "destructive",
      });
    },
  });
}
