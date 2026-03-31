import { useState, useEffect } from "react";
import { useSearch } from "@tanstack/react-router";
import { useToast } from "@/components/ui/use-toast";
import {
  useInviteValidationQuery,
  useInviteMutation,
} from "@/hooks/queries/useInviteValidationQuery";

export function useInviteValidation() {
  const search = useSearch({ strict: false });
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const { toast } = useToast();

  // Extract token from search params
  useEffect(() => {
    const token = search.invite;
    if (token) {
      setInviteToken(token);
    }
  }, [search]);

  const {
    data: inviteValidation,
    isLoading: isValidating,
    error: validationError,
  } = useInviteValidationQuery(inviteToken);

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

  async function useInvite(userId: string) {
    if (!inviteToken) return false;

    try {
      await inviteMutation.mutateAsync({
        token: inviteToken,
        userId,
      });

      // Show success message with group name if available
      toast({
        title: "Success",
        description: `Welcome to ${inviteValidation?.group_name || "the group"}!`,
      });

      return true;
    } catch (error) {
      console.error("failed validating invite", error);
      // Error handling is done in the mutation
      return false;
    }
  }

  function clearInvite() {
    setInviteToken(null);
  }

  return {
    inviteToken,
    inviteValidation,
    isValidating,
    validationError: validationError?.message || null,
    useInvite,
    clearInvite,
    hasValidInvite: inviteValidation?.is_valid === true,
  };
}
