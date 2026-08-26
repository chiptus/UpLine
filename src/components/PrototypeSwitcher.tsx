// PROTOTYPE (issue #400) — throwaway floating variant switcher. Remove with
// the prototype it drives.
import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PrototypeSwitcherProps {
  variants: Array<{ key: string; name: string }>;
  current: string;
  onChange: (variant: string) => void;
}

export function PrototypeSwitcher({
  variants,
  current,
  onChange,
}: PrototypeSwitcherProps) {
  const index = Math.max(
    0,
    variants.findIndex((v) => v.key === current),
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") cycle(-1);
      if (e.key === "ArrowRight") cycle(1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-foreground text-background px-3 py-1.5 shadow-lg text-sm">
      <button
        type="button"
        onClick={() => cycle(-1)}
        aria-label="Previous variant"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="font-medium whitespace-nowrap">
        {variants[index].key} ({variants[index].name})
      </span>
      <button type="button" onClick={() => cycle(1)} aria-label="Next variant">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );

  function cycle(dir: number) {
    const next = (index + dir + variants.length) % variants.length;
    onChange(variants[next].key);
  }
}
