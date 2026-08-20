import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useInviteValidationQuery } from "@/api/invite-validation/useInviteValidationQuery";
import { useAcceptInviteMutation } from "@/api/invite-validation/useAcceptInviteMutation";
import { InviteLandingPage } from "@/components/invite/InviteLandingPage";

const inviteSearchSchema = z.object({
  invite: z.string(),
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
  const { invite: inviteToken, redirect } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const inviteQuery = useInviteValidationQuery(inviteToken);
  const acceptMutation = useAcceptInviteMutation();
  const attemptedTokenRef = useRef<string | null>(null);

  const runAccept = useCallback(
    (userId: string) => {
      attemptedTokenRef.current = inviteToken;
      acceptMutation.mutate(
        { token: inviteToken, userId },
        {
          onSuccess: () => {
            navigate({ to: redirect || "/", replace: true });
          },
          onError: (error) => {
            console.error("Failed to accept invite", error);
            attemptedTokenRef.current = null;
          },
        },
      );
    },
    [inviteToken, acceptMutation, navigate, redirect],
  );

  useEffect(() => {
    const isValid = inviteQuery.data?.is_valid === true;
    if (
      !user ||
      isValid !== true ||
      attemptedTokenRef.current === inviteToken
    ) {
      return;
    }
    runAccept(user.id);
  }, [user, inviteToken, inviteQuery.data, runAccept]);

  if (authLoading || inviteQuery.isLoading) {
    return (
      <StatusScreen>
        <Loader2 className="h-10 w-10 mx-auto mb-4 text-purple-400 animate-spin" />
        <p className="text-white">Validating invite...</p>
      </StatusScreen>
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
      <JoiningState
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

interface JoiningStateProps {
  groupName: string | undefined;
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  onContinue: () => void;
}

function JoiningState({
  groupName,
  isPending,
  error,
  onRetry,
  onContinue,
}: JoiningStateProps) {
  if (isPending) {
    return (
      <StatusScreen>
        <Loader2 className="h-10 w-10 mx-auto mb-4 text-purple-400 animate-spin" />
        <p className="text-white">Joining {groupName || "the group"}...</p>
      </StatusScreen>
    );
  }

  return (
    <StatusScreen>
      <Card className="max-w-md w-full mx-auto">
        <CardHeader className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <CardTitle className="text-red-600">Couldn't join group</CardTitle>
          <CardDescription>
            {error?.message || "Something went wrong."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button onClick={onRetry}>Try again</Button>
          <Button variant="outline" onClick={onContinue}>
            Continue to app
          </Button>
        </CardContent>
      </Card>
    </StatusScreen>
  );
}

function StatusScreen({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-app-gradient flex items-center justify-center p-4">
      <div className="text-center">{children}</div>
    </div>
  );
}
