import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  useInviteValidationQuery,
  useInviteMutation,
} from "@/api/invite-validation/useInviteValidationQuery";

export function useInviteValidation(inviteToken: string | undefined) {
  const { toast } = useToast();

  const {
    data: inviteValidation,
    isLoading: isValidating,
    error: validationError,
  } = useInviteValidationQuery(inviteToken || null);

  const inviteMutation = useInviteMutation();

  // Handle validation side effects
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

  function acceptInvite(userId: string): Promise<boolean> {
    if (!inviteToken) return Promise.resolve(false);

    return new Promise((resolve) => {
      inviteMutation.mutate(
        {
          token: inviteToken,
          userId,
        },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: `Welcome to ${inviteValidation?.group_name || "the group"}!`,
            });
            resolve(true);
          },
          onError: (error) => {
            console.error("failed accepting invite", error);
            resolve(false);
          },
        },
      );
    });
  }

  return {
    inviteToken: inviteToken || null,
    inviteValidation,
    isValidating,
    validationError: validationError?.message || null,
    acceptInvite,
    hasValidInvite: inviteValidation?.is_valid === true,
  };
}
