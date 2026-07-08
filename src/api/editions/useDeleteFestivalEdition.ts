import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { editionsKeys } from "./types";

async function deleteFestivalEdition(editionId: string) {
  const { error } = await supabase
    .from("festival_editions")
    .update({ archived: true })
    .eq("id", editionId);

  if (error) throw error;
  return true;
}

export function useDeleteFestivalEditionMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ editionId }: { editionId: string; festivalId: string }) =>
      deleteFestivalEdition(editionId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: editionsKeys.root(variables.festivalId),
      });
      queryClient.invalidateQueries({ queryKey: editionsKeys.bySlugRoot() });
      toast({
        title: "Success",
        description: "Festival edition deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting festival edition:", error);
      toast({
        title: "Error",
        description: "Failed to delete festival edition",
        variant: "destructive",
      });
    },
  });
}
