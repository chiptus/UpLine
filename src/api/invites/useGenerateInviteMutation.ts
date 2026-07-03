import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { inviteKeys } from "./types";

async function generateInviteLink(
  groupId: string,
  options?: {
    expiresAt?: Date;
    maxUses?: number;
  },
): Promise<string> {
  // Generate a cryptographically secure random token
  const token = crypto.randomUUID() + "-" + Date.now().toString(36);

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication required");
  }

  const inviteData = {
    group_id: groupId,
    invite_token: token,
    created_by: user.id,
    expires_at: options?.expiresAt?.toISOString(),
    max_uses: options?.maxUses,
  };

  const { error } = await supabase.from("group_invites").insert(inviteData);

  if (error) {
    throw new Error("Failed to generate invite link");
  }

  // Return the full invite URL
  const baseUrl = window.location.origin;
  return `${baseUrl}/?invite=${token}`;
}

export function useGenerateInviteMutation(groupId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (
      options: {
        expiresAt?: Date;
        maxUses?: number;
      } = {},
    ) => {
      const inviteUrl = await generateInviteLink(groupId, options);

      // Copy to clipboard
      await navigator.clipboard.writeText(inviteUrl);

      return inviteUrl;
    },
    onSuccess: () => {
      toast({
        title: "Invite Created",
        description: "Invite link copied to clipboard!",
      });
      // Refetch invites to show the new one
      queryClient.invalidateQueries({ queryKey: inviteKeys.group(groupId) });
    },
    onError: (error) => {
      console.error("Error generating invite:", error);
      toast({
        title: "Error",
        description: "Failed to generate invite link",
        variant: "destructive",
      });
    },
  });
}
