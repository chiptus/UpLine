import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { festivalsKeys } from "./types";

async function createFestival(festivalData: {
  name: string;
  slug: string;
  description?: string;
  published?: boolean;
  logo_url?: string | null;
}) {
  const { data, error } = await supabase
    .from("festivals")
    .insert(festivalData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function useCreateFestivalMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createFestival,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: festivalsKeys.all() });
      toast({
        title: "Success",
        description: "Festival created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating festival:", error);
      toast({
        title: "Error",
        description: "Failed to create festival",
        variant: "destructive",
      });
    },
  });
}
