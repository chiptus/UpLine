import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Toaster } from "@/components/ui/toaster";
import { ConfirmDialogHost } from "@/components/ConfirmDialogHost";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieConsentBanner } from "@/components/layout/legal/CookieConsentBanner";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { StagingEnvironmentBadge } from "@/components/ui/StagingEnvironmentBadge";
import { AppUpdatePrompt } from "@/components/layout/AppUpdatePrompt";
import { AppFooter } from "@/components/layout/AppFooter";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { ActiveScopeProvider } from "@/contexts/ActiveScopeContext";
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
import { useClearStaticTags } from "@/hooks/useClearStaticTags";

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
  beforeLoad: async ({ search, location }) => {
    if (search.invite && location.pathname !== "/invite") {
      const { invite: _invite, ...restSearch } = location.search as Record<
        string,
        unknown
      >;
      const remainingSearch = new URLSearchParams(
        restSearch as Record<string, string>,
      ).toString();
      const redirectTarget = `${location.pathname}${remainingSearch ? `?${remainingSearch}` : ""}${location.hash}`;

      throw redirect({
        to: "/invite",
        search: { invite: search.invite, redirect: redirectTarget },
      });
    }

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

function RootComponent() {
  useClearStaticTags();

  return (
    <>
      <HeadContent />
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <ConfirmDialogHost />
          <AppUpdatePrompt />
          <CookieConsentBanner />
          <AuthProvider>
            <ActiveScopeProvider>
              <RootContent />
            </ActiveScopeProvider>
          </AuthProvider>
          <OfflineIndicator />
          <StagingEnvironmentBadge />
          <SpeedInsights />
          {import.meta.env.DEV && <TanStackRouterDevtools />}
        </TooltipProvider>
      </ThemeProvider>
    </>
  );
}

function RootContent() {
  const { user, loading: authLoading, needsOnboarding } = useAuth();

  const { isLoading: profileLoading } = useProfileQuery(user?.id);

  const showOnboarding = useMemo(() => {
    return !!user && !authLoading && !profileLoading && needsOnboarding;
  }, [user, authLoading, profileLoading, needsOnboarding]);

  useEffect(() => {
    if (shouldRedirectFromWww()) {
      window.location.href = getNonWwwRedirectUrl();
    }
  }, []);

  return (
    <div className="app-view min-h-screen bg-ground flex flex-col">
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
