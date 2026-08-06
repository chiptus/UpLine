import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { useAcceptInviteMutation } from "@/api/invite-validation/useAcceptInviteMutation";
import type { InviteValidation } from "@/types/invites";

interface UseInviteAcceptanceParams {
  inviteToken: string | undefined;
  inviteValidation: InviteValidation | null | undefined;
  user: User | null;
}

export function useInviteAcceptance({
  inviteToken,
  inviteValidation,
  user,
}: UseInviteAcceptanceParams) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { mutate: acceptInvite } = useAcceptInviteMutation();
  const attemptedTokenRef = useRef<string | null>(null);

  const groupName = inviteValidation?.group_name;
  const isValid = inviteValidation?.is_valid === true;

  useEffect(() => {
    if (!user || !inviteToken || !isValid) return;
    if (attemptedTokenRef.current === inviteToken) return;
    attemptedTokenRef.current = inviteToken;

    acceptInvite(
      { token: inviteToken, userId: user.id },
      {
        onSuccess: (result) => {
          toast({
            title: result.alreadyMember ? "Already a member" : "Success",
            description: result.alreadyMember
              ? `You're already a member of ${groupName || "the group"}.`
              : `Welcome to ${groupName || "the group"}!`,
          });
          navigate({
            to: ".",
            search: (prev) => ({ ...prev, invite: undefined }),
            replace: true,
          });
        },
        onError: (error) => {
          console.error("Failed to accept invite", error);
          attemptedTokenRef.current = null;
          toast({
            title: "Couldn't join group",
            description: error.message,
            variant: "destructive",
          });
        },
      },
    );
  }, [user, inviteToken, isValid, acceptInvite, groupName, toast, navigate]);
}
