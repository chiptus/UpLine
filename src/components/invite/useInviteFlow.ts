import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { useInviteValidationQuery } from "@/api/invite-validation/useInviteValidationQuery";
import { useAcceptInviteMutation } from "@/api/invite-validation/useAcceptInviteMutation";

export function useInviteFlow(
  inviteToken: string | undefined,
  user: User | null,
) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    data: inviteValidation,
    isLoading: isValidating,
    error: validationError,
  } = useInviteValidationQuery(inviteToken || null);

  const { mutate: acceptInvite } = useAcceptInviteMutation();
  const attemptedTokenRef = useRef<string | null>(null);

  const groupName = inviteValidation?.group_name;
  const isValid = inviteValidation?.is_valid === true;

  useEffect(() => {
    if (validationError) {
      toast({
        title: "Invalid Invite",
        description: "This invite link is not valid",
        variant: "destructive",
      });
    }
  }, [validationError, toast]);

  useEffect(() => {
    if (inviteValidation && !inviteValidation.is_valid) {
      let message = "This invite link is no longer valid";
      switch (inviteValidation.reason) {
        case "invite_expired":
          message = "This invite link has expired";
          break;
        case "invite_overused":
          message = "This invite link has reached its usage limit";
          break;
        case "invite_deactivated":
          message = "This invite link has been deactivated";
          break;
      }
      toast({
        title: "Invalid Invite",
        description: message,
        variant: "destructive",
      });
    }
  }, [inviteValidation, toast]);

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

  return {
    inviteValidation,
    isValidating,
    hasValidInvite: isValid,
  };
}
