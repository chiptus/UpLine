import { useState } from "react";
import { z } from "zod";
import { CrossDomainStorage } from "@/lib/crossDomainStorage";
import { useLocalStorageState } from "./useLocalStorageState";

const CONSENT_KEY = "gdpr-consent";
const CONSENT_VERSION = "1.0";

const consentPreferencesSchema = z.object({
  essential: z.boolean(),
  analytics: z.boolean(),
  preferences: z.boolean(),
  marketing: z.boolean(),
  version: z.string(),
  timestamp: z.number(),
});

export type ConsentPreferences = z.infer<typeof consentPreferencesSchema>;

const defaultConsent: ConsentPreferences = {
  essential: true, // Always true, required for app to function
  analytics: false,
  preferences: false,
  marketing: false,
  version: CONSENT_VERSION,
  timestamp: Date.now(),
};

export function useCookieConsent() {
  const [storedConsent, setStoredConsent] = useLocalStorageState(
    CONSENT_KEY,
    consentPreferencesSchema.nullable(),
    null,
    CrossDomainStorage,
  );

  // A stored record from a previous CONSENT_VERSION is treated as no consent,
  // same as the version-mismatch banner-reset behavior before this migration.
  const consent =
    storedConsent && storedConsent.version === CONSENT_VERSION
      ? storedConsent
      : null;

  const [showBanner, setShowBanner] = useState(() => consent === null);

  function saveConsent(preferences: Partial<ConsentPreferences>) {
    const newConsent = {
      ...defaultConsent,
      ...preferences,
      timestamp: Date.now(),
    };

    setStoredConsent(newConsent);
    setShowBanner(false);
  }

  function acceptAll() {
    saveConsent({
      essential: true,
      analytics: true,
      preferences: true,
      marketing: true,
    });
  }

  function acceptEssential() {
    saveConsent({
      essential: true,
      analytics: false,
      preferences: false,
      marketing: false,
    });
  }

  function updateConsent(preferences: Partial<ConsentPreferences>) {
    if (consent) {
      saveConsent({ ...consent, ...preferences });
    }
  }

  function revokeConsent() {
    CrossDomainStorage.removeItem(CONSENT_KEY);
    setStoredConsent(null);
    setShowBanner(true);

    // Clear non-essential cookies
    if (!consent?.preferences) {
      localStorage.removeItem("sidebar:state");
    }
  }

  function canUseCookie(type: keyof ConsentPreferences) {
    return consent?.[type] === true;
  }

  return {
    consent,
    showBanner,
    saveConsent,
    acceptAll,
    acceptEssential,
    updateConsent,
    revokeConsent,
    canUseCookie,
    setShowBanner,
  };
}
