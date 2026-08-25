import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { useState, useEffect } from "react";

interface CookiePreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CookiePreferencesDialog({
  open,
  onOpenChange,
}: CookiePreferencesDialogProps) {
  const { consent, saveConsent } = useCookieConsent();
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    preferences: false,
    marketing: false,
  });

  useEffect(() => {
    if (consent) {
      setPreferences({
        essential: consent.essential,
        analytics: consent.analytics,
        preferences: consent.preferences,
        marketing: consent.marketing,
      });
    }
  }, [consent]);

  function handleSave() {
    saveConsent(preferences);
    onOpenChange(false);
  }

  const cookieCategories = [
    {
      id: "essential" as const,
      title: "Essential Cookies",
      description:
        "Required for the app to function properly. Includes sidebar state and session management.",
      required: true,
    },
    {
      id: "preferences" as const,
      title: "Preference Cookies",
      description: "Remember your choices and personalize your experience.",
      required: false,
    },
    {
      id: "analytics" as const,
      title: "Analytics Cookies",
      description: "Help us understand how you use the app to improve it.",
      required: false,
    },
    {
      id: "marketing" as const,
      title: "Marketing Cookies",
      description: "Used to show you relevant content and advertisements.",
      required: false,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cookie Preferences</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Manage your cookie settings and privacy preferences. You can control
            which types of cookies are stored on your device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Manage your cookie preferences below. You can change these settings
            at any time.
          </p>

          <div className="space-y-4">
            {cookieCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="flex-1 space-y-2">
                  <h4 className="font-medium">{category.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
                <div className="ml-4">
                  <Switch
                    checked={preferences[category.id]}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({
                        ...prev,
                        [category.id]: checked,
                      }))
                    }
                    disabled={category.required}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Preferences</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
