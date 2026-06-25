import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { stagesKeys } from "./types";

async function deleteStage(stageId: string) {
  const { error } = await supabase
    .from("stages")
    .update({ archived: true })
    .eq("id", stageId);

  if (error) throw error;
}

export function useDeleteStageMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteStage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: stagesKeys.all,
      });
      toast({
        title: "Success",
        description: "Stage deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting stage:", error);
      toast({
        title: "Error",
        description: "Failed to delete stage",
        variant: "destructive",
      });
    },
  });
}
