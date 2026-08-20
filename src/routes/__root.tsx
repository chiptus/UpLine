import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  useSearch,
} from "@tanstack/react-router";
import { createPortal } from "react-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ConfirmDialogHost } from "@/components/ConfirmDialogHost";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieConsentBanner } from "@/components/layout/legal/CookieConsentBanner";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { AppUpdatePrompt } from "@/components/layout/AppUpdatePrompt";
import { AppFooter } from "@/components/layout/AppFooter";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { ActiveScopeProvider } from "@/contexts/ActiveScopeContext";
import { useInviteFlow } from "@/components/invite/useInviteFlow";
import { InviteLandingPage } from "@/components/invite/InviteLandingPage";
import { OnboardingDialog } from "@/components/onboarding/OnboardingDialog";
import { useProfileQuery } from "@/api/auth/useProfile";
import { useMemo, useEffect } from "react";
import { shouldRedirectFromWww, getNonWwwRedirectUrl } from "@/lib/subdomain";
import { z } from "zod";
import type { QueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { userGroupsQuery } from "@/api/groups/useUserGroups";
import { pageMeta } from "@/lib/pageHead";

const rootSearchSchema = z.object({
  invite: z.string().optional(),
});

interface RouterContext {
  queryClient: QueryClient;
  user: User | null;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  validateSearch: rootSearchSchema,
  head: () => ({
    meta: pageMeta({ description: "UpLine - Your Festival companion" }),
  }),
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return { user: session?.user ?? null };
  },
  loader: async ({ context }) => {
    if (context.user) {
      void context.queryClient.ensureQueryData(
        userGroupsQuery(context.user.id, { all: false }),
      );
    }
  },
});

const STATIC_HEAD_SELECTORS = [
  "title",
  'meta[name="description"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
];

function RootComponent() {
  useEffect(() => {
    STATIC_HEAD_SELECTORS.forEach((selector) => {
      document.head.querySelector(selector)?.remove();
    });
  }, []);

  return (
    <>
      {createPortal(<HeadContent />, document.head)}
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ConfirmDialogHost />
        <AppUpdatePrompt />
        <CookieConsentBanner />
        <AuthProvider>
          <ActiveScopeProvider>
            <RootContent />
          </ActiveScopeProvider>
        </AuthProvider>
        <OfflineIndicator />
        <SpeedInsights />
        {import.meta.env.DEV && <TanStackRouterDevtools />}
      </TooltipProvider>
    </>
  );
}

function RootContent() {
  const { user, loading: authLoading, needsOnboarding } = useAuth();
  const search = useSearch({ from: "__root__" });
  const { inviteValidation, isValidating, hasValidInvite } = useInviteFlow(
    search.invite,
    user,
  );

  const { isLoading: profileLoading } = useProfileQuery(user?.id);

  const showOnboarding = useMemo(() => {
    return !!user && !authLoading && !profileLoading && needsOnboarding;
  }, [user, authLoading, profileLoading, needsOnboarding]);

  useEffect(() => {
    if (shouldRedirectFromWww()) {
      window.location.href = getNonWwwRedirectUrl();
    }
  }, []);

  if (isValidating) {
    return (
      <div className="min-h-screen bg-app-gradient flex items-center justify-center">
        <div className="text-white text-xl">Validating invite...</div>
      </div>
    );
  }

  if (hasValidInvite && !user && inviteValidation && search.invite) {
    return (
      <InviteLandingPage
        inviteValidation={inviteValidation}
        inviteToken={search.invite}
      />
    );
  }

  if (inviteValidation && !inviteValidation.is_valid) {
    return (
      <div className="min-h-screen bg-app-gradient flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Invalid Invite</h1>
          <p className="mb-4">This invite link is no longer valid.</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
          >
            Continue to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <Outlet />
      </div>
      <AppFooter />
      {user && (
        <OnboardingDialog
          open={showOnboarding}
          user={user}
          onComplete={() => {}}
        />
      )}
    </div>
  );
}
