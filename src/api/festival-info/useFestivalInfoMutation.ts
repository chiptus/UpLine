import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { festivalInfoKeys } from "./types";

export function useFestivalInfoMutation(festivalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Tables<"festival_info">>) => {
      // Check if festival info already exists
      const { data: existingInfo } = await supabase
        .from("festival_info")
        .select("id")
        .eq("festival_id", festivalId)
        .single();

      if (existingInfo) {
        // Update existing record
        const { error } = await supabase
          .from("festival_info")
          .update(data)
          .eq("festival_id", festivalId);
        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase.from("festival_info").insert({
          festival_id: festivalId,
          ...data,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: festivalInfoKeys.byFestival(festivalId),
      });
    },
  });
}
