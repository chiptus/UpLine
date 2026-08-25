import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeContext";

type MediaChangeListener = (event: MediaQueryListEvent) => void;

let systemPrefersLight = false;
let mediaListeners: Set<MediaChangeListener>;

function fireSystemChange(prefersLight: boolean) {
  systemPrefersLight = prefersLight;
  for (const listener of mediaListeners) {
    listener({ matches: prefersLight } as MediaQueryListEvent);
  }
}

function renderTheme() {
  return renderHook(() => useTheme(), {
    wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
  });
}

describe("ThemeContext", () => {
  beforeEach(() => {
    localStorage.clear();
    systemPrefersLight = false;
    mediaListeners = new Set();
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: systemPrefersLight,
        media: query,
        addEventListener: (_: string, listener: MediaChangeListener) => {
          mediaListeners.add(listener);
        },
        removeEventListener: (_: string, listener: MediaChangeListener) => {
          mediaListeners.delete(listener);
        },
      })),
    );
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
    vi.unstubAllGlobals();
  });

  it("defaults to system preference when nothing is stored", () => {
    const { result } = renderTheme();
    expect(result.current.preference).toBe("system");
  });

  it("reads a stored light preference and applies it on change", () => {
    localStorage.setItem("theme", "light");
    const { result } = renderTheme();
    expect(result.current.preference).toBe("light");
  });

  it("setPreference('light') persists and sets data-theme", () => {
    const { result } = renderTheme();

    act(() => result.current.setPreference("light"));

    expect(localStorage.getItem("theme")).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(result.current.preference).toBe("light");
  });

  it("setPreference('dark') persists and removes data-theme", () => {
    document.documentElement.setAttribute("data-theme", "light");
    const { result } = renderTheme();

    act(() => result.current.setPreference("dark"));

    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("setPreference('system') clears storage and follows the OS scheme", () => {
    localStorage.setItem("theme", "dark");
    systemPrefersLight = true;
    const { result } = renderTheme();

    act(() => result.current.setPreference("system"));

    expect(localStorage.getItem("theme")).toBeNull();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("re-applies the theme when the OS scheme changes under system preference", () => {
    renderTheme();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);

    act(() => fireSystemChange(true));

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("ignores OS scheme changes when an explicit preference is stored", () => {
    localStorage.setItem("theme", "dark");
    renderTheme();

    act(() => fireSystemChange(true));

    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("syncs preference from a storage event in another tab", () => {
    const { result } = renderTheme();

    act(() => {
      localStorage.setItem("theme", "light");
      window.dispatchEvent(
        new StorageEvent("storage", { key: "theme", newValue: "light" }),
      );
    });

    expect(result.current.preference).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("keeps reacting to OS changes regardless of extra consumers unmounting", () => {
    const extra = renderTheme();
    const { result } = renderTheme();
    extra.unmount();

    act(() => fireSystemChange(true));

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(result.current.preference).toBe("system");
  });

  it("throws when used outside a ThemeProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow(
      "useTheme must be used within a ThemeProvider",
    );
    vi.restoreAllMocks();
  });
});
