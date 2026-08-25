import { Music } from "lucide-react";
import { useFestivalPhase } from "@/hooks/useFestivalPhase";

interface EditionHeroProps {
  title: string;
  logoUrl?: string | null | undefined;
  onRowRefChange?: (node: HTMLElement | null) => void;
}

export function EditionHero({
  title,
  logoUrl,
  onRowRefChange,
}: EditionHeroProps) {
  return (
    <div
      ref={onRowRefChange}
      className="mb-4 md:mb-8 flex flex-col items-center gap-3 md:gap-4 text-center"
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${title} logo`}
          className="h-16 md:h-24 lg:h-28 w-auto max-w-xs md:max-w-sm object-contain rounded"
        />
      ) : (
        <Music className="h-10 w-10 md:h-14 md:w-14 text-accent" />
      )}
      <h1 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">
        {title}
      </h1>
      <LiveIndicator />
    </div>
  );
}

function LiveIndicator() {
  const { phase } = useFestivalPhase();
  if (phase !== "live") return null;

  return (
    <span
      role="status"
      className="flex items-center gap-1.5 text-sm text-live-foreground"
      aria-label="Festival is live now"
    >
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 rounded-full bg-live animate-pulse"
      />
      Live
    </span>
  );
}
