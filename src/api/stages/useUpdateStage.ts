import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { stagesKeys } from "./types";

async function updateStage(
  stageId: string,
  stageData: { name: string; stage_order?: number; color?: string },
) {
  const { data, error } = await supabase
    .from("stages")
    .update(stageData)
    .eq("id", stageId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function useUpdateStageMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      stageId,
      stageData,
    }: {
      stageId: string;
      stageData: { name: string; stage_order?: number; color?: string };
    }) => updateStage(stageId, stageData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: stagesKeys.all,
      });
      toast({
        title: "Success",
        description: "Stage updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating stage:", error);
      toast({
        title: "Error",
        description: "Failed to update stage",
        variant: "destructive",
      });
    },
  });
}
