import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { groupsKeys } from "@/api/groups/types";
import type { InviteUsageResult } from "@/types/invites";

interface AcceptInviteParams {
  token: string;
  userId: string;
}

export interface AcceptInviteResult extends InviteUsageResult {
  alreadyMember: boolean;
}

async function acceptInvite({
  token,
  userId,
}: AcceptInviteParams): Promise<AcceptInviteResult> {
  const { data, error } = await supabase.rpc("use_invite_token", {
    token,
    user_id: userId,
  });

  if (error) {
    console.error("Error using invite:", error);
    throw new Error("Failed to join group");
  }

  const result = data?.[0];
  if (!result) {
    throw new Error("Failed to join group");
  }

  if (result.success) {
    return { ...result, alreadyMember: false };
  }

  if (result.message === "User already in group") {
    return { ...result, alreadyMember: true };
  }

  throw new Error(result.message);
}

export function useAcceptInviteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptInvite,
    onSuccess: (result) => {
      if (!result.alreadyMember) {
        queryClient.invalidateQueries({ queryKey: groupsKeys.all });
      }
    },
  });
}
