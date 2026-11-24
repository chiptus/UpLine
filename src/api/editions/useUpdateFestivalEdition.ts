import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isSlugConflictError, SlugConflictError } from "@/lib/slug";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { festivalsKeys } from "@/api/festivals/types";

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

  if (error) {
    if (isSlugConflictError(error)) throw new SlugConflictError();
    throw error;
  }
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
      queryClient.invalidateQueries({ queryKey: festivalsKeys.root() });
      toast({
        title: "Success",
        description: "Festival edition updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating festival edition:", error);
      toast({
        title: "Error",
        description:
          error instanceof SlugConflictError
            ? error.message
            : "Failed to update festival edition",
        variant: "destructive",
      });
    },
  });
}
