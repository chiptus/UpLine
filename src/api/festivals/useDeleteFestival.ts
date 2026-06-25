import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { festivalsKeys } from "./types";

async function deleteFestival(festivalId: string) {
  const { error } = await supabase
    .from("festivals")
    .update({ archived: true })
    .eq("id", festivalId);

  if (error) throw error;
  return true;
}

export function useDeleteFestivalMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteFestival,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: festivalsKeys.all() });
      toast({
        title: "Success",
        description: "Festival deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting festival:", error);
      toast({
        title: "Error",
        description: "Failed to delete festival",
        variant: "destructive",
      });
    },
  });
}
