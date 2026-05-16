import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateSlug } from "@/lib/slug";
import { FestivalSet, setsKeys } from "./useSets";

// Mutation function
async function updateSet(variables: {
  id: string;
  updates: Partial<Omit<FestivalSet, "artists" | "votes" | "stages">>;
}) {
  const { id, updates } = variables;
  const { stage_name: _sn, ...rest } = updates;

  // If name is being updated, regenerate slug
  const updateData = { ...rest };
  if (updates.name) {
    updateData.slug = generateSlug(updates.name);
  }

  const { data, error } = await supabase
    .from("sets")
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating set:", error);
    throw new Error("Failed to update set");
  }

  return data;
}

// Hook
export function useUpdateSetMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: updateSet,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: setsKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: setsKeys.detail(data.id),
      });
      toast({
        title: "Success",
        description: "Set updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update set",
        variant: "destructive",
      });
    },
  });
}
