import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { useInviteValidationQuery } from "@/api/invite-validation/useInviteValidationQuery";
import { useAcceptInviteMutation } from "@/api/invite-validation/useAcceptInviteMutation";
import type { InviteValidation } from "@/types/invites";

export function useInviteFlow(
  inviteToken: string | undefined,
  user: User | null,
) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const inviteQuery = useInviteValidationQuery(inviteToken || null);
  const { mutate: acceptInvite } = useAcceptInviteMutation();
  const attemptedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const error = getError(inviteQuery.error, inviteQuery.data);
    if (error) {
      toast({
        title: "Invalid Invite",
        description: error,
        variant: "destructive",
      });
    }
  }, [inviteQuery.error, inviteQuery.data, toast]);

  useEffect(() => {
    const groupName = inviteQuery.data?.group_name;
    if (!user || !inviteToken || inviteQuery.data?.is_valid !== true) return;
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
  }, [user, inviteToken, inviteQuery.data, acceptInvite, toast, navigate]);

  return {
    inviteValidation: inviteQuery.data,
    isValidating: inviteQuery.isLoading,
    hasValidInvite: inviteQuery.data?.is_valid === true,
  };
}

function getError(
  error: Error | null,
  inviteValidation: InviteValidation | null | undefined,
): string | null {
  if (error) return "This invite link is not valid";
  if (!inviteValidation || inviteValidation.is_valid) return null;

  switch (inviteValidation.reason) {
    case "invite_expired":
      return "This invite link has expired";
    case "invite_overused":
      return "This invite link has reached its usage limit";
    case "invite_deactivated":
      return "This invite link has been deactivated";
    default:
      return "This invite link is no longer valid";
  }
}
