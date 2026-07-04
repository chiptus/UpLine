import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { groupsKeys } from "./types";

// Mutation function
async function deleteGroup(variables: { groupId: string; userId: string }) {
  const { groupId, userId } = variables;

  const { error } = await supabase
    .from("groups")
    .update({ archived: true })
    .eq("id", groupId)
    .eq("created_by", userId);

  if (error) {
    throw new Error("Failed to delete group");
  }

  return true;
}

// Hook
export function useDeleteGroupMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: (_data, variables) => {
      // Invalidate all group-related queries
      queryClient.invalidateQueries({
        queryKey: groupsKeys.user(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: groupsKeys.all,
      });
      toast({
        title: "Success",
        description: "Group deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete group",
        variant: "destructive",
      });
    },
  });
}
