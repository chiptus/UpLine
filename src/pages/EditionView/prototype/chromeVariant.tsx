// PROTOTYPE — throwaway chrome-density exploration for the Schedule tab.
// Question: how should the stacked chrome (phase banner, view switcher,
// timezone bar, filters, timeline toolbar) consolidate so mobile feels
// less packed? See NOTES.md. Delete this folder and every call site
// marked "PROTOTYPE:" once a variant wins.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// One chrome (top nav + auto-hide) with three treatments of the identity
// row's phase-status line; "current" stays as the flip-back baseline.
export const CHROME_VARIANTS = [
  "current",
  "autohide-countdown",
  "autohide-dates",
  "autohide-cta",
  "collapse",
] as const;

export type ChromeVariant = (typeof CHROME_VARIANTS)[number];

const VARIANT_LABELS: Record<ChromeVariant, string> = {
  current: "Current",
  "autohide-countdown": "Auto-hide · countdown",
  "autohide-dates": "Auto-hide · dates + dot",
  "autohide-cta": "Auto-hide · vote CTA",
  collapse: "Hero, collapses on scroll",
};

const ChromeVariantContext = createContext<ChromeVariant>("current");

export function useChromeVariant(): ChromeVariant {
  return useContext(ChromeVariantContext);
}

const STORAGE_KEY = "prototype-chrome-variant";

function isVariant(value: string | null): value is ChromeVariant {
  return (CHROME_VARIANTS as readonly string[]).includes(value ?? "");
}

function migrateLegacy(value: string | null): string | null {
  return value === "autohide" ? "autohide-countdown" : value;
}

function initialVariant(): ChromeVariant {
  const raw = migrateLegacy(
    new URLSearchParams(window.location.search).get("variant"),
  );
  if (isVariant(raw)) {
    window.sessionStorage.setItem(STORAGE_KEY, raw);
    return raw;
  }
  // Fall back to the stored choice — the router strips ?variant= on
  // redirects (e.g. /festivals/<slug> → default edition) before this
  // lazily-loaded module gets to read it.
  const stored = migrateLegacy(window.sessionStorage.getItem(STORAGE_KEY));
  return isVariant(stored) ? stored : "current";
}

// Captured at module load, before the router normalizes the URL and strips
// unknown search params.
const INITIAL_VARIANT = initialVariant();

export function ChromeVariantProvider({ children }: PropsWithChildren) {
  const [variant, setVariant] = useState<ChromeVariant>(INITIAL_VARIANT);

  // Router navigations strip unknown search params (zod schemas), so state is
  // the source of truth; the URL is only kept in sync for shareability.
  useEffect(() => {
    window.sessionStorage.setItem(STORAGE_KEY, variant);
    const url = new URL(window.location.href);
    if (variant === "current") {
      url.searchParams.delete("variant");
    } else {
      url.searchParams.set("variant", variant);
    }
    window.history.replaceState(window.history.state, "", url);
  }, [variant]);

  // No production gate: this ships on a draft prototype PR so the preview
  // deploy can flip variants too. The whole folder is deleted after the
  // verdict — it must never reach main.
  return (
    <ChromeVariantContext.Provider value={variant}>
      {children}
      <VariantSwitcher variant={variant} onChange={setVariant} />
    </ChromeVariantContext.Provider>
  );
}

interface VariantSwitcherProps {
  variant: ChromeVariant;
  onChange: (variant: ChromeVariant) => void;
}

function VariantSwitcher({ variant, onChange }: VariantSwitcherProps) {
  const index = CHROME_VARIANTS.indexOf(variant);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="fixed bottom-36 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-1 rounded-full bg-white px-2 py-1.5 text-sm font-medium text-gray-900 shadow-xl ring-1 ring-black/20">
      <button
        type="button"
        aria-label="Previous variant"
        onClick={() => step(-1)}
        className="rounded-full p-1 hover:bg-gray-200"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-36 text-center">
        {index + 1}/{CHROME_VARIANTS.length} · {VARIANT_LABELS[variant]}
      </span>
      <button
        type="button"
        aria-label="Next variant"
        onClick={() => step(1)}
        className="rounded-full p-1 hover:bg-gray-200"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );

  function step(delta: number) {
    const count = CHROME_VARIANTS.length;
    onChange(CHROME_VARIANTS[(index + delta + count) % count]);
  }
}
