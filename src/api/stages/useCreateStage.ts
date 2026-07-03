import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { stagesKeys } from "./types";
import { generateSlug } from "@/lib/slug";

async function createStage(stageData: {
  name: string;
  festival_edition_id: string;
  stage_order?: number;
  color?: string;
}) {
  const { data, error } = await supabase
    .from("stages")
    .insert({
      ...stageData,
      slug: generateSlug(stageData.name),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function useCreateStageMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createStage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: stagesKeys.all,
      });
      toast({
        title: "Success",
        description: "Stage created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating stage:", error);
      toast({
        title: "Error",
        description: "Failed to create stage",
        variant: "destructive",
      });
    },
  });
}
