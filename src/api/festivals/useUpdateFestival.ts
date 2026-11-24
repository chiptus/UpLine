import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isSlugConflictError, SlugConflictError } from "@/lib/slug";
import { supabase } from "@/integrations/supabase/client";
import { festivalsKeys } from "./types";

export type FestivalUpdateData = Partial<{
  name: string;
  slug: string;
  description?: string;
  published?: boolean;
  logo_url?: string | null;
  timezone?: string;
  day_end_hour?: number;
}>;

export async function updateFestival(
  festivalId: string,
  festivalData: FestivalUpdateData,
) {
  const { data, error } = await supabase
    .from("festivals")
    .update(festivalData)
    .eq("id", festivalId)
    .select()
    .single();

  if (error) {
    if (isSlugConflictError(error)) throw new SlugConflictError();
    throw error;
  }
  return data;
}

export function useUpdateFestivalMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      festivalId,
      festivalData,
    }: {
      festivalId: string;
      festivalData: FestivalUpdateData;
    }) => updateFestival(festivalId, festivalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: festivalsKeys.root() });
      toast({
        title: "Success",
        description: "Festival updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating festival:", error);
      toast({
        title: "Error",
        description:
          error instanceof SlugConflictError
            ? error.message
            : "Failed to update festival",
        variant: "destructive",
      });
    },
  });
}
