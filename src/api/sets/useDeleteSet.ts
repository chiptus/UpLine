import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { setsKeys } from "./types";

// Mutation function
async function deleteSet(id: string): Promise<void> {
  const { error } = await supabase
    .from("sets")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error archiving set:", error);
    throw new Error("Failed to archive set");
  }
}

// Hook
export function useDeleteSetMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteSet,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: setsKeys.all,
      });
      toast({
        title: "Success",
        description: "Set archived successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to archive set",
        variant: "destructive",
      });
    },
  });
}
