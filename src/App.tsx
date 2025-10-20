import { SpeedInsights } from "@vercel/speed-insights/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CookieConsentBanner } from "@/components/layout/legal/CookieConsentBanner";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import {
  getSubdomainInfo,
  shouldRedirectFromWww,
  getNonWwwRedirectUrl,
} from "@/lib/subdomain";
import { AuthProvider } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { FestivalEditionProvider } from "./contexts/FestivalEditionContext";
import { AppRoutes } from "./components/router/AppRoutes";

function App() {
  const [subdomainInfo] = useState(() => getSubdomainInfo());

  // Redirect www.getupline.com to getupline.com
  useEffect(() => {
    if (shouldRedirectFromWww()) {
      window.location.href = getNonWwwRedirectUrl();
    }
  }, []);

  return (
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CookieConsentBanner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <FestivalEditionProvider>
              <AppRoutes subdomainInfo={subdomainInfo} />
            </FestivalEditionProvider>
          </AuthProvider>
        </BrowserRouter>
        <OfflineIndicator />
      </TooltipProvider>

      <SpeedInsights />
    </HelmetProvider>
  );
}

export default App;
