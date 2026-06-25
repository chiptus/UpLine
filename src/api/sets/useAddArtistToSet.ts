import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { setsKeys } from "./types";

// Mutation function
async function addArtistToSet(variables: {
  setId: string;
  artistId: string;
}): Promise<void> {
  const { setId, artistId } = variables;

  const { error } = await supabase
    .from("set_artists")
    .insert({ set_id: setId, artist_id: artistId });

  if (error) {
    console.error("Error adding artist to set:", error);
    throw new Error("Failed to add artist to set");
  }
}

// Hook
export function useAddArtistToSetMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: addArtistToSet,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: setsKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: setsKeys.detail(variables.setId),
      });
      toast({
        title: "Success",
        description: "Artist added to set successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add artist to set",
        variant: "destructive",
      });
    },
  });
}
