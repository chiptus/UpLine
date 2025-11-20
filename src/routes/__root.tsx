import { createRootRoute, Outlet } from "@tanstack/react-router";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieConsentBanner } from "@/components/layout/legal/CookieConsentBanner";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { AppFooter } from "@/components/layout/AppFooter";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { FestivalEditionProvider } from "@/contexts/FestivalEditionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useInviteValidation } from "@/components/invite/useInviteValidation";
import { InviteLandingPage } from "@/components/invite/InviteLandingPage";
import { OnboardingDialog } from "@/components/onboarding/OnboardingDialog";
import { useProfileQuery } from "@/hooks/queries/auth/useProfile";
import { useMemo, useEffect } from "react";
import {
  shouldRedirectFromWww,
  getNonWwwRedirectUrl,
} from "@/lib/subdomain";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CookieConsentBanner />
        <AuthProvider>
          <FestivalEditionProvider>
            <RootContent />
          </FestivalEditionProvider>
        </AuthProvider>
        <OfflineIndicator />
        <SpeedInsights />
        {import.meta.env.DEV && <TanStackRouterDevtools />}
      </TooltipProvider>
    </HelmetProvider>
  );
}

function RootContent() {
  const { user, loading: authLoading, needsOnboarding } = useAuth();
  const { inviteValidation, isValidating, hasValidInvite } =
    useInviteValidation();

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

  if (hasValidInvite && !user && inviteValidation) {
    return (
      <InviteLandingPage
        inviteValidation={inviteValidation}
        onSignupSuccess={() => {}}
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
