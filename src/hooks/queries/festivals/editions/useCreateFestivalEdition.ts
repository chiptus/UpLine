import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { festivalsKeys } from "../types";
import type { Database } from "@/integrations/supabase/types";

type RevealLevel = Database["public"]["Enums"]["schedule_reveal_level"];

async function createFestivalEdition(editionData: {
  name: string;
  slug: string;
  start_date: string | null;
  end_date: string | null;
  festival_id: string;
  description?: string | null;
  year: number;
  published?: boolean;
  schedule_reveal_level?: RevealLevel;
}) {
  const { data, error } = await supabase
    .from("festival_editions")
    .insert(editionData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function useCreateFestivalEditionMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createFestivalEdition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: festivalsKeys.all() });
      toast({
        title: "Success",
        description: "Festival edition created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating festival edition:", error);
      toast({
        title: "Error",
        description: "Failed to create festival edition",
        variant: "destructive",
      });
    },
  });
}
