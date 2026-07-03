import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { inviteKeys } from "./types";

async function deleteInvite(inviteId: string): Promise<void> {
  const { error } = await supabase
    .from("group_invites")
    .delete()
    .eq("id", inviteId);

  if (error) {
    throw new Error("Failed to delete invite");
  }
}

export function useDeleteInviteMutation(groupId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      await deleteInvite(inviteId);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invite deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: inviteKeys.group(groupId) });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete invite",
        variant: "destructive",
      });
    },
  });
}
