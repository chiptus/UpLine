import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { generateSlug } from "@/lib/slug";
import { FestivalSet, setsKeys } from "./types";

type SetInsert = Database["public"]["Tables"]["sets"]["Insert"];

// Mutation function
async function createSet(
  setData: Omit<
    FestivalSet,
    | "id"
    | "created_at"
    | "updated_at"
    | "artists"
    | "votes"
    | "stages"
    | "archived"
    | "slug"
  >,
): Promise<FestivalSet> {
  const insertData: SetInsert = {
    name: setData.name,
    description: setData.description,
    festival_edition_id: setData.festival_edition_id,
    stage_id: setData.stage_id,
    time_start: setData.time_start,
    time_end: setData.time_end,
    created_by: setData.created_by,
    slug: generateSlug(setData.name),
    archived: false,
  };

  // First, create the set without slug
  const { data, error } = await supabase
    .from("sets")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error creating set:", error);
    throw new Error("Failed to create set");
  }

  // Generate and update the slug using the created ID
  const slug = generateSlug(data.name);
  const { error: slugError } = await supabase
    .from("sets")
    .update({ slug })
    .eq("id", data.id);

  if (slugError) {
    console.error("Error updating set slug:", slugError);
    throw new Error("Failed to generate set slug");
  }

  return {
    ...data,
    slug,
    artists: [],
    votes: [],
  };
}

// Hook
export function useCreateSetMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createSet,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: setsKeys.all,
      });
      toast({
        title: "Success",
        description: "Set created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create set",
        variant: "destructive",
      });
    },
  });
}
