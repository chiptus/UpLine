import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useToast } from "@/hooks/use-toast";
import { useInviteValidationQuery } from "@/api/invite-validation/useInviteValidationQuery";
import { useAcceptInviteMutation } from "@/api/invite-validation/useAcceptInviteMutation";

export function useAcceptInviteFlow(
  inviteToken: string,
  userId: string | undefined,
  redirect: string | undefined,
) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const inviteQuery = useInviteValidationQuery(inviteToken);
  const acceptMutation = useAcceptInviteMutation();
  const attemptedTokenRef = useRef<string | null>(null);

  const runAccept = useCallback(
    (currentUserId: string) => {
      attemptedTokenRef.current = inviteToken;
      const groupName = inviteQuery.data?.group_name;
      acceptMutation.mutate(
        { token: inviteToken, userId: currentUserId },
        {
          onSuccess: (result) => {
            toast({
              title: result.alreadyMember ? "Already a member" : "Success",
              description: result.alreadyMember
                ? `You're already a member of ${groupName || "the group"}.`
                : `Welcome to ${groupName || "the group"}!`,
            });
            navigate({ to: redirect || "/", replace: true });
          },
          onError: (error) => {
            console.error("Failed to accept invite", error);
            attemptedTokenRef.current = null;
          },
        },
      );
    },
    [inviteToken, acceptMutation, navigate, redirect, toast, inviteQuery.data],
  );

  useEffect(() => {
    const isValid = inviteQuery.data?.is_valid === true;
    if (
      !userId ||
      isValid !== true ||
      attemptedTokenRef.current === inviteToken
    ) {
      return;
    }
    runAccept(userId);
  }, [userId, inviteToken, inviteQuery.data, runAccept]);

  return { inviteQuery, acceptMutation, runAccept };
}
