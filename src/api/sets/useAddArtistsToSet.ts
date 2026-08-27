import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { setsKeys } from "./types";

// Mutation function
async function addArtistsToSet(variables: {
  setId: string;
  artistIds: string[];
}): Promise<void> {
  const { setId, artistIds } = variables;

  const { error } = await supabase
    .from("set_artists")
    .insert(
      artistIds.map((artistId) => ({ set_id: setId, artist_id: artistId })),
    );

  if (error) {
    console.error("Error adding artists to set:", error);
    throw new Error("Failed to add artists to set");
  }
}

// Hook
export function useAddArtistsToSetMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: addArtistsToSet,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: setsKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: setsKeys.detail(variables.setId),
      });
      toast({
        title: "Success",
        description: "Artists added to set successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add artists to set",
        variant: "destructive",
      });
    },
  });
}
