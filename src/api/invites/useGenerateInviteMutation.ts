import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { inviteKeys } from "./types";

type GroupInviteInsert =
  Database["public"]["Tables"]["group_invites"]["Insert"];

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

  const inviteData: GroupInviteInsert = {
    group_id: groupId,
    invite_token: token,
    created_by: user.id,
  };
  if (options?.expiresAt !== undefined) {
    inviteData.expires_at = options.expiresAt.toISOString();
  }
  if (options?.maxUses !== undefined) {
    inviteData.max_uses = options.maxUses;
  }

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
    mutationFn: (
      options: {
        expiresAt?: Date;
        maxUses?: number;
      } = {},
    ) => generateInviteLink(groupId, options),
    onSuccess: async (inviteUrl) => {
      // Clipboard access can be denied by the browser (permissions, headless
      // environments) independently of the invite itself being created, so a
      // denial here must not surface as a mutation failure and skip the
      // refetch below.
      let copied = true;
      try {
        await navigator.clipboard.writeText(inviteUrl);
      } catch {
        copied = false;
      }
      toast({
        title: "Invite Created",
        description: copied
          ? "Invite link copied to clipboard!"
          : "Invite link generated.",
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
