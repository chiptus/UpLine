import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { festivalsKeys } from "../types";
import type { Database } from "@/integrations/supabase/types";

type UpdateEditionData =
  Database["public"]["Tables"]["festival_editions"]["Update"];

async function updateFestivalEdition(
  editionId: string,
  editionData: UpdateEditionData,
) {
  const { data, error } = await supabase
    .from("festival_editions")
    .update(editionData)
    .eq("id", editionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function useUpdateFestivalEditionMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      editionId,
      editionData,
    }: {
      editionId: string;
      editionData: UpdateEditionData;
    }) => updateFestivalEdition(editionId, editionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: festivalsKeys.all() });
      queryClient.invalidateQueries({ queryKey: ["festival-editions"] });
      toast({
        title: "Success",
        description: "Festival edition updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating festival edition:", error);
      toast({
        title: "Error",
        description: "Failed to update festival edition",
        variant: "destructive",
      });
    },
  });
}
