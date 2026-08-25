import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const preference = useSyncExternalStore(subscribe, readPreference);

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      if (next === "system") {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, next);
      }
    } catch {
      // localStorage unavailable — theme still applies for this page view
    }
    applyTheme(next);
    for (const listener of listeners) {
      listener();
    }
  }, []);

  const value = useMemo(
    () => ({ preference, setPreference }),
    [preference, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

const listeners = new Set<() => void>();

let media: MediaQueryList | null = null;

function subscribe(onStoreChange: () => void) {
  if (listeners.size === 0) {
    media = window.matchMedia("(prefers-color-scheme: light)");
    media.addEventListener("change", handleSystemChange);
    window.addEventListener("storage", handleStorageChange);
  }
  listeners.add(onStoreChange);

  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0) {
      media?.removeEventListener("change", handleSystemChange);
      media = null;
      window.removeEventListener("storage", handleStorageChange);
    }
  };
}

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") {
    return preference;
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function applyTheme(preference: ThemePreference) {
  if (resolveTheme(preference) === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

function handleSystemChange() {
  applyTheme(readPreference());
}

function handleStorageChange(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) {
    return;
  }
  applyTheme(readPreference());
  for (const listener of listeners) {
    listener();
  }
}
