import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { profileKeys } from "@/api/auth/types";

async function setActiveGroup(variables: {
  userId: string;
  groupId: string | null;
}) {
  const { userId, groupId } = variables;

  const { error } = await supabase
    .from("profiles")
    .update({ active_group_id: groupId, active_group_selected: true })
    .eq("id", userId);

  if (error) {
    throw new Error("Failed to update active group");
  }
}

export function useSetActiveGroupMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: setActiveGroup,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(variables.userId),
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update active group",
        variant: "destructive",
      });
    },
  });
}
