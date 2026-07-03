import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { groupsKeys } from "./types";

// Mutation function
async function joinGroup(variables: { groupId: string; userId: string }) {
  const { groupId, userId } = variables;

  const { error } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: userId,
  });

  if (error) {
    throw new Error("Failed to join group");
  }

  return true;
}

// Hook
export function useJoinGroupMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: joinGroup,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: groupsKeys.user(variables.userId),
      });
      toast({
        title: "Success",
        description: "Joined group successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to join group",
        variant: "destructive",
      });
    },
  });
}
