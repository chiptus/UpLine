import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { festivalsKeys } from "./types";

async function updateFestival(
  festivalId: string,
  festivalData: Partial<{
    name: string;
    slug: string;
    description?: string;
    published?: boolean;
    logo_url?: string | null;
    timezone?: string;
    day_start_hour?: number;
  }>,
) {
  const { data, error } = await supabase
    .from("festivals")
    .update(festivalData)
    .eq("id", festivalId)
    .select()
    .single();

  if (error) throw error;
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
      festivalData: Partial<{
        name: string;
        slug: string;
        description?: string;
        published?: boolean;
        logo_url?: string | null;
        timezone?: string;
        day_start_hour?: number;
      }>;
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
        description: "Failed to update festival",
        variant: "destructive",
      });
    },
  });
}
