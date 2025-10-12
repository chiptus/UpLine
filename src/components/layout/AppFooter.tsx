import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Settings } from "lucide-react";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { CookiePreferencesDialog } from "./legal/CookiePreferencesDialog";

export function AppFooter() {
  const [showCookiePreferences, setShowCookiePreferences] = useState(false);
  const { revokeConsent } = useCookieConsent();

  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="border-t bg-background/50 backdrop-blur mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* App Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Festival Voting App</h3>
              <p className="text-sm text-muted-foreground">
                Collaborate with your group to discover and vote on the best
                festival artists.
              </p>
              <p className="text-xs text-muted-foreground">GDPR Compliant</p>
            </div>

            {/* Legal Links */}
            <div className="space-y-4">
              <h4 className="font-medium">Legal</h4>
              <div className="flex flex-col space-y-2 text-sm">
                <Link
                  to="/privacy"
                  className="text-left hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  to="/cookies"
                  className="hover:text-primary transition-colors"
                >
                  Cookie Policy
                </Link>
              </div>
            </div>

            {/* Privacy Controls */}
            <div className="space-y-4">
              <h4 className="font-medium">Privacy Controls</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCookiePreferences(true)}
                  className="w-full justify-start"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Cookie Preferences
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={revokeConsent}
                  className="w-full justify-start"
                >
                  Reset Consent
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>© {currentYear} Festival Voting App. All rights reserved.</p>
            <p className="mt-2 sm:mt-0">
              Questions? Contact us at{" "}
              <a
                href="mailto:upline@getupline.com"
                className="hover:text-primary transition-colors"
              >
                upline@getupline.com
              </a>
            </p>
          </div>
        </div>
      </footer>

      <CookiePreferencesDialog
        open={showCookiePreferences}
        onOpenChange={setShowCookiePreferences}
      />
    </>
  );
}
