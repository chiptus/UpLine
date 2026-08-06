import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useInviteValidationQuery } from "@/api/invite-validation/useInviteValidationQuery";

export function useInviteValidation(inviteToken: string | undefined) {
  const { toast } = useToast();

  const {
    data: inviteValidation,
    isLoading: isValidating,
    error: validationError,
  } = useInviteValidationQuery(inviteToken || null);

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

  return {
    inviteToken: inviteToken || null,
    inviteValidation,
    isValidating,
    validationError: validationError?.message || null,
    hasValidInvite: inviteValidation?.is_valid === true,
  };
}
