import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { generateSlug } from "@/lib/slug";
import { setsKeys } from "./types";

type SetUpdate = Database["public"]["Tables"]["sets"]["Update"];

export type UpdateSetInput = Partial<
  Pick<
    SetUpdate,
    | "name"
    | "description"
    | "festival_edition_id"
    | "stage_id"
    | "time_start"
    | "time_end"
    | "archived"
  >
>;

// Mutation function
async function updateSet(variables: { id: string; updates: UpdateSetInput }) {
  const { id, updates } = variables;

  const updateData: SetUpdate = {};
  if (updates.name !== undefined) {
    updateData.name = updates.name;
    updateData.slug = generateSlug(updates.name);
  }
  if (updates.description !== undefined) {
    updateData.description = updates.description;
  }
  if (updates.festival_edition_id !== undefined) {
    updateData.festival_edition_id = updates.festival_edition_id;
  }
  if (updates.stage_id !== undefined) {
    updateData.stage_id = updates.stage_id;
  }
  if (updates.time_start !== undefined) {
    updateData.time_start = updates.time_start;
  }
  if (updates.time_end !== undefined) {
    updateData.time_end = updates.time_end;
  }
  if (updates.archived !== undefined) {
    updateData.archived = updates.archived;
  }

  const { data, error } = await supabase
    .from("sets")
    .update(updateData)
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
