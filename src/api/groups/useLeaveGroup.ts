import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { groupsKeys } from "./types";

// Mutation function
async function leaveGroup(variables: { groupId: string; userId: string }) {
  const { groupId, userId } = variables;

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) {
    throw new Error("Failed to leave group");
  }

  return true;
}

// Hook
export function useLeaveGroupMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: leaveGroup,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: groupsKeys.user(variables.userId),
      });
      toast({
        title: "Success",
        description: "Left group successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to leave group",
        variant: "destructive",
      });
    },
  });
}
