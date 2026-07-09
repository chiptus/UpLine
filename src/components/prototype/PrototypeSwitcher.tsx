// PROTOTYPE (timeline nav & filtering) — throwaway, delete with
// src/pages/EditionView/tabs/ScheduleTab/horizontal/prototype/.
//
// Floating variant switcher: arrows (and ←/→ keys) cycle the `?variant=`
// search param. Renders only when a variant is already active in the URL —
// normal users never see it, and preview deploys (production builds) can
// still flip variants when sharing the prototype.
import { useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ROUTE =
  "/festivals/$festivalSlug/editions/$editionSlug/schedule/timeline" as const;

const VARIANTS = [
  { key: "a", name: "Slim jump bar" },
  { key: "b", name: "Segmented rail" },
  { key: "c", name: "Mini-map" },
] as const;

export function PrototypeSwitcher() {
  const { variant } = useSearch({ from: ROUTE });
  const navigate = useNavigate({ from: ROUTE });

  const index = Math.max(
    0,
    VARIANTS.findIndex((v) => v.key === variant),
  );
  const current = VARIANTS[index];

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
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

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (!variant) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full border border-white/20 bg-gray-950 px-3 py-1.5 shadow-xl">
        <button
          type="button"
          onClick={() => cycle(-1)}
          className="text-white/70 hover:text-white"
          aria-label="Previous variant"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="whitespace-nowrap font-mono text-xs text-white">
          {current.key.toUpperCase()} — {current.name}
        </span>
        <button
          type="button"
          onClick={() => cycle(1)}
          className="text-white/70 hover:text-white"
          aria-label="Next variant"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  function cycle(delta: number) {
    const next = VARIANTS[(index + delta + VARIANTS.length) % VARIANTS.length];
    navigate({
      to: ".",
      search: (prev) => ({ ...prev, variant: next.key }),
      replace: true,
    });
  }
}
