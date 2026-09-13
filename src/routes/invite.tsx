import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { InviteLandingPage } from "@/components/invite/InviteLandingPage";
import { InviteStatusScreen } from "@/components/invite/InviteStatusScreen";
import { InviteJoiningState } from "@/components/invite/InviteJoiningState";
import { useAcceptInviteFlow } from "@/components/invite/useAcceptInviteFlow";

const inviteSearchSchema = z.object({
  token: z.string(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/invite")({
  component: InviteRoute,
  validateSearch: inviteSearchSchema,
  errorComponent: InviteSearchError,
});

function InviteSearchError() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/", replace: true });
  }, [navigate]);

  return null;
}

function InviteRoute() {
  const { token: inviteToken, redirect } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { inviteQuery, acceptMutation, runAccept } = useAcceptInviteFlow(
    inviteToken,
    user?.id,
    redirect,
  );

  if (authLoading || inviteQuery.isLoading) {
    return (
      <InviteStatusScreen>
        <Loader2 className="h-10 w-10 mx-auto mb-4 text-purple-400 animate-spin" />
        <p className="text-white">Validating invite...</p>
      </InviteStatusScreen>
    );
  }

  if (
    inviteQuery.error ||
    inviteQuery.data === null ||
    inviteQuery.data?.is_valid === false
  ) {
    return (
      <InviteLandingPage
        inviteValidation={
          inviteQuery.data ?? {
            invite_id: "",
            group_id: "",
            group_name: "",
            is_valid: false,
            reason: "invite_invalid",
          }
        }
        inviteToken={inviteToken}
      />
    );
  }

  if (user && (acceptMutation.isPending || acceptMutation.isError)) {
    return (
      <InviteJoiningState
        groupName={inviteQuery.data?.group_name}
        isPending={acceptMutation.isPending}
        error={acceptMutation.error}
        onRetry={() => {
          acceptMutation.reset();
          runAccept(user.id);
        }}
        onContinue={() => navigate({ to: redirect || "/" })}
      />
    );
  }

  if (inviteQuery.data) {
    return (
      <InviteLandingPage
        inviteValidation={inviteQuery.data}
        inviteToken={inviteToken}
      />
    );
  }

  return null;
}
