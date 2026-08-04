import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { generateSlug, slugCandidate } from "@/lib/slug";
import { FestivalSet, setsKeys } from "./types";

type SetInsert = Database["public"]["Tables"]["sets"]["Insert"];

const UNIQUE_VIOLATION = "23505";
const MAX_SLUG_ATTEMPTS = 50;

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
  const baseSlug = generateSlug(setData.name);

  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
    const insertData: SetInsert = {
      name: setData.name,
      description: setData.description,
      festival_edition_id: setData.festival_edition_id,
      stage_id: setData.stage_id,
      time_start: setData.time_start,
      time_end: setData.time_end,
      created_by: setData.created_by,
      slug: slugCandidate(baseSlug, attempt),
      archived: false,
    };

    const { data, error } = await supabase
      .from("sets")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        continue;
      }
      console.error("Error creating set:", error);
      throw new Error("Failed to create set");
    }

    return {
      ...data,
      artists: [],
      votes: [],
    };
  }

  throw new Error("Failed to create set: could not find a unique slug");
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
