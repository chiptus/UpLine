import { useCallback, useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "edition-theme";

const listeners = new Set<() => void>();

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
    document.documentElement.setAttribute("data-edition-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-edition-theme");
  }
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);

  const media = window.matchMedia("(prefers-color-scheme: light)");
  media.addEventListener("change", handleSystemChange);

  window.addEventListener("storage", handleStorageChange);

  return () => {
    listeners.delete(onStoreChange);
    media.removeEventListener("change", handleSystemChange);
    window.removeEventListener("storage", handleStorageChange);
  };
}

export function useEditionTheme() {
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

  return { preference, setPreference };
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
