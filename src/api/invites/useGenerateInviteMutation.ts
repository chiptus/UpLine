import { useMutation, useQueryClient } from "@tanstack/react-query";
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

  return useMutation({
    mutationFn: (
      options: {
        expiresAt?: Date;
        maxUses?: number;
      } = {},
    ) => generateInviteLink(groupId, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inviteKeys.group(groupId) });
    },
  });
}
