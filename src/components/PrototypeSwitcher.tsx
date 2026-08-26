import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// PROTOTYPE ONLY — floating variant switcher for throwaway UI prototypes.
// Hidden in production builds. Delete once the prototype question is settled.

interface PrototypeSwitcherProps {
  variants: { key: string; name: string }[];
  current: string;
  onChange: (key: string) => void;
}

export function PrototypeSwitcher({
  variants,
  current,
  onChange,
}: PrototypeSwitcherProps) {
  const currentIndex = Math.max(
    0,
    variants.findIndex((variant) => variant.key === current),
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowLeft") cycle(-1);
      else cycle(1);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (import.meta.env.PROD) return null;

  const currentVariant = variants[currentIndex];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-full bg-foreground text-background px-2 py-1 shadow-lg">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full hover:bg-background/20 hover:text-background"
        onClick={() => cycle(-1)}
        aria-label="Previous variant"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="px-2 text-sm font-medium whitespace-nowrap">
        {currentVariant.key.toUpperCase()} ({currentVariant.name})
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full hover:bg-background/20 hover:text-background"
        onClick={() => cycle(1)}
        aria-label="Next variant"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  function cycle(direction: number) {
    const next = (currentIndex + direction + variants.length) % variants.length;
    onChange(variants[next].key);
  }
}
