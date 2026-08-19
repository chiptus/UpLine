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

  const updateData: SetUpdate = {
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.description !== undefined
      ? { description: updates.description }
      : {}),
    ...(updates.festival_edition_id !== undefined
      ? { festival_edition_id: updates.festival_edition_id }
      : {}),
    ...(updates.stage_id !== undefined ? { stage_id: updates.stage_id } : {}),
    ...(updates.time_start !== undefined
      ? { time_start: updates.time_start }
      : {}),
    ...(updates.time_end !== undefined ? { time_end: updates.time_end } : {}),
    ...(updates.archived !== undefined ? { archived: updates.archived } : {}),
  };
  if (updates.name !== undefined) {
    updateData.slug = generateSlug(updates.name);
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
