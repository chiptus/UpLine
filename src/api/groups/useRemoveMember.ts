import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { groupsKeys } from "./types";

// Mutation function
async function removeMemberFromGroup(variables: {
  groupId: string;
  userId: string;
  currentUserId: string;
}) {
  const { groupId, userId, currentUserId } = variables;

  // First check if current user is the group creator
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("created_by")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    throw new Error("Group not found");
  }

  if (group.created_by !== currentUserId) {
    throw new Error("Only group creators can remove members");
  }

  // Prevent removing the creator
  if (userId === currentUserId) {
    throw new Error("You cannot remove yourself as the group creator");
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) {
    throw new Error("Failed to remove member from group");
  }

  return { groupId, userId };
}

// Hook
export function useRemoveMemberMutation(groupId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (variables: { userId: string; currentUserId: string }) =>
      removeMemberFromGroup({ ...variables, groupId }),
    onSuccess: () => {
      // Invalidate group members query to refresh the list
      queryClient.invalidateQueries({
        queryKey: groupsKeys.members(groupId),
      });

      toast({
        title: "Success",
        description: "Member removed from group successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to remove member",
        variant: "destructive",
      });
    },
  });
}
