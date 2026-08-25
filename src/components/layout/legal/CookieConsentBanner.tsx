import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { Settings } from "lucide-react";
import { useState } from "react";
import { CookiePreferencesDialog } from "./CookiePreferencesDialog";

export function CookieConsentBanner() {
  const { showBanner, acceptAll, acceptEssential } = useCookieConsent();
  const [showPreferences, setShowPreferences] = useState(false);

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-0 md:bottom-0 left-0 right-0 z-50 p-4 pb-24 md:pb-4">
        <Card className="mx-auto max-w-4xl p-6 bg-background/95 backdrop-blur border shadow-lg">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">Cookie Consent</h3>
              <p className="text-sm text-paper-muted-foreground mb-3">
                We use essential cookies to make our app work properly and
                remember your preferences like sidebar state. We respect your
                privacy and don't use any tracking or analytics cookies.
              </p>
              <p className="text-xs text-paper-muted-foreground">
                By clicking "Accept", you agree to our use of essential cookies.
                Learn more in our{" "}
                <a href="/privacy" className="underline hover:text-primary">
                  Privacy Policy
                </a>{" "}
                and{" "}
                <a href="/cookies" className="underline hover:text-primary">
                  Cookie Policy
                </a>
                .
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreferences(true)}
                className="w-full sm:w-auto"
              >
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={acceptEssential}
                className="w-full sm:w-auto"
              >
                Essential Only
              </Button>
              <Button
                size="sm"
                onClick={acceptAll}
                className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Accept All
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <CookiePreferencesDialog
        open={showPreferences}
        onOpenChange={setShowPreferences}
      />
    </>
  );
}
