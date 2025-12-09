import { describe, expect, it, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCookieConsent } from "./useCookieConsent";
import * as CrossDomainStorageModule from "@/lib/crossDomainStorage";

vi.mock("@/lib/crossDomainStorage", () => ({
  CrossDomainStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe("useCookieConsent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("initializes with null consent and showBanner true when no saved consent", async () => {
    vi.spyOn(
      CrossDomainStorageModule.CrossDomainStorage,
      "getItem",
    ).mockReturnValue(null);

    const { result } = renderHook(() => useCookieConsent());

    await waitFor(() => {
      expect(result.current.consent).toBeNull();
      expect(result.current.showBanner).toBe(true);
    });
  });

  it("loads saved consent from storage", async () => {
    const savedConsent = {
      essential: true,
      analytics: true,
      preferences: false,
      marketing: false,
      version: "1.0",
      timestamp: Date.now(),
    };

    vi.spyOn(
      CrossDomainStorageModule.CrossDomainStorage,
      "getItem",
    ).mockReturnValue(JSON.stringify(savedConsent));

    const { result } = renderHook(() => useCookieConsent());

    await waitFor(() => {
      expect(result.current.consent).toEqual(savedConsent);
      expect(result.current.showBanner).toBe(false);
    });
  });

  it("shows banner when saved consent has wrong version", async () => {
    const savedConsent = {
      essential: true,
      analytics: true,
      preferences: false,
      marketing: false,
      version: "0.9",
      timestamp: Date.now(),
    };

    vi.spyOn(
      CrossDomainStorageModule.CrossDomainStorage,
      "getItem",
    ).mockReturnValue(JSON.stringify(savedConsent));

    const { result } = renderHook(() => useCookieConsent());

    await waitFor(() => {
      expect(result.current.showBanner).toBe(true);
    });
  });

  it("shows banner when saved consent is invalid JSON", async () => {
    vi.spyOn(
      CrossDomainStorageModule.CrossDomainStorage,
      "getItem",
    ).mockReturnValue("invalid json");

    const { result } = renderHook(() => useCookieConsent());

    await waitFor(() => {
      expect(result.current.showBanner).toBe(true);
    });
  });

  it("saveConsent updates consent and hides banner", () => {
    vi.spyOn(
      CrossDomainStorageModule.CrossDomainStorage,
      "getItem",
    ).mockReturnValue(null);
    const setItemSpy = vi.spyOn(
      CrossDomainStorageModule.CrossDomainStorage,
      "setItem",
    );

    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.saveConsent({ analytics: true });
    });

    expect(result.current.consent).toMatchObject({
      essential: true,
      analytics: true,
    });
    expect(result.current.showBanner).toBe(false);
    expect(setItemSpy).toHaveBeenCalled();
  });

  it("acceptAll enables all preferences", () => {
    vi.spyOn(
      CrossDomainStorageModule.CrossDomainStorage,
      "getItem",
    ).mockReturnValue(null);

    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.acceptAll();
    });

    expect(result.current.consent).toMatchObject({
      essential: true,
      analytics: true,
      preferences: true,
      marketing: true,
    });
    expect(result.current.showBanner).toBe(false);
  });

  it("acceptEssential only enables essential cookies", () => {
    vi.spyOn(
      CrossDomainStorageModule.CrossDomainStorage,
      "getItem",
    ).mockReturnValue(null);

    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.acceptEssential();
    });

    expect(result.current.consent).toMatchObject({
      essential: true,
      analytics: false,
      preferences: false,
      marketing: false,
    });
    expect(result.current.showBanner).toBe(false);
  });

  it("updateConsent merges with existing consent", () => {
    const savedConsent = {
      essential: true,
      analytics: true,
      preferences: false,
      marketing: false,
      version: "1.0",
      timestamp: Date.now(),
    };

    vi.spyOn(
      CrossDomainStorageModule.CrossDomainStorage,
      "getItem",
    ).mockReturnValue(JSON.stringify(savedConsent));

    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.updateConsent({ marketing: true });
    });

    expect(result.current.consent).toMatchObject({
      essential: true,
      analytics: true,
      preferences: false,
      marketing: true,
    });
  });

  it("revokeConsent clears consent and shows banner", () => {
    const savedConsent = {
      essential: true,
      analytics: true,
      preferences: false,
      marketing: false,
      version: "1.0",
      timestamp: Date.now(),
    };

    vi.spyOn(
      CrossDomainStorageModule.CrossDomainStorage,
      "getItem",
    ).mockReturnValue(JSON.stringify(savedConsent));
    const removeItemSpy = vi.spyOn(
      CrossDomainStorageModule.CrossDomainStorage,
      "removeItem",
    );

    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.revokeConsent();
    });

    expect(result.current.consent).toBeNull();
    expect(result.current.showBanner).toBe(true);
    expect(removeItemSpy).toHaveBeenCalledWith("gdpr-consent");
  });

  it("canUseCookie returns true when permission granted", () => {
    const savedConsent = {
      essential: true,
      analytics: true,
      preferences: false,
      marketing: false,
      version: "1.0",
      timestamp: Date.now(),
    };

    vi.spyOn(
      CrossDomainStorageModule.CrossDomainStorage,
      "getItem",
    ).mockReturnValue(JSON.stringify(savedConsent));

    const { result } = renderHook(() => useCookieConsent());

    expect(result.current.canUseCookie("analytics")).toBe(true);
    expect(result.current.canUseCookie("essential")).toBe(true);
  });

  it("canUseCookie returns false when permission not granted", () => {
    const savedConsent = {
      essential: true,
      analytics: false,
      preferences: false,
      marketing: false,
      version: "1.0",
      timestamp: Date.now(),
    };

    vi.spyOn(
      CrossDomainStorageModule.CrossDomainStorage,
      "getItem",
    ).mockReturnValue(JSON.stringify(savedConsent));

    const { result } = renderHook(() => useCookieConsent());

    expect(result.current.canUseCookie("analytics")).toBe(false);
    expect(result.current.canUseCookie("marketing")).toBe(false);
  });

  it("canUseCookie returns false when no consent", () => {
    vi.spyOn(
      CrossDomainStorageModule.CrossDomainStorage,
      "getItem",
    ).mockReturnValue(null);

    const { result } = renderHook(() => useCookieConsent());

    expect(result.current.canUseCookie("analytics")).toBe(false);
  });

  it("setShowBanner updates banner visibility", () => {
    vi.spyOn(
      CrossDomainStorageModule.CrossDomainStorage,
      "getItem",
    ).mockReturnValue(null);

    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.setShowBanner(false);
    });

    expect(result.current.showBanner).toBe(false);

    act(() => {
      result.current.setShowBanner(true);
    });

    expect(result.current.showBanner).toBe(true);
  });

  it("saveConsent sets timestamp and version", () => {
    vi.spyOn(
      CrossDomainStorageModule.CrossDomainStorage,
      "getItem",
    ).mockReturnValue(null);
    const setItemSpy = vi.spyOn(
      CrossDomainStorageModule.CrossDomainStorage,
      "setItem",
    );

    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.saveConsent({ analytics: true });
    });

    expect(result.current.consent?.version).toBe("1.0");
    expect(result.current.consent?.timestamp).toBeDefined();
    expect(typeof result.current.consent?.timestamp).toBe("number");
    expect(setItemSpy).toHaveBeenCalledWith(
      "gdpr-consent",
      expect.stringContaining('"version":"1.0"'),
    );
  });

  it("revokeConsent clears sidebar state when preferences not granted", () => {
    const savedConsent = {
      essential: true,
      analytics: false,
      preferences: false,
      marketing: false,
      version: "1.0",
      timestamp: Date.now(),
    };

    vi.spyOn(
      CrossDomainStorageModule.CrossDomainStorage,
      "getItem",
    ).mockReturnValue(JSON.stringify(savedConsent));

    localStorage.setItem("sidebar:state", "collapsed");
    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.revokeConsent();
    });

    expect(localStorage.getItem("sidebar:state")).toBeNull();
  });

  it("defaults to essential true", () => {
    vi.spyOn(
      CrossDomainStorageModule.CrossDomainStorage,
      "getItem",
    ).mockReturnValue(null);

    const { result } = renderHook(() => useCookieConsent());

    act(() => {
      result.current.acceptEssential();
    });

    expect(result.current.consent?.essential).toBe(true);

    act(() => {
      result.current.saveConsent({ analytics: true });
    });

    expect(result.current.consent?.essential).toBe(true);
    expect(result.current.consent?.analytics).toBe(true);
  });
});
