// PROTOTYPE — per-variant edition header (hero title + phase treatment).
// See chromeVariant.tsx.
import { Music } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { PhaseBanner, bannerMessage } from "../PhaseBanner";
import { useChromeVariant } from "./chromeVariant";
import { useFestivalPhase } from "@/hooks/useFestivalPhase";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";

interface EditionHeaderVariantsProps {
  title: string;
  logoUrl?: string | null;
  websiteUrl?: string;
  ticketsUrl?: string;
}

export function EditionHeaderVariants({
  title,
  logoUrl,
  websiteUrl,
  ticketsUrl,
}: EditionHeaderVariantsProps) {
  const variant = useChromeVariant();

  if (variant === "current") {
    return (
      <>
        <AppHeader
          title={title}
          logoUrl={logoUrl}
          showGroupsButton
          websiteUrl={websiteUrl}
          ticketsUrl={ticketsUrl}
        />
        <PhaseBanner />
      </>
    );
  }

  if (variant === "compact") {
    return (
      <>
        <AppHeader showGroupsButton />
        <CompactIdentityRow title={title} logoUrl={logoUrl} />
      </>
    );
  }

  // quiet + commandbar: full hero, phase demoted to a subtitle line
  return (
    <>
      <AppHeader
        title={title}
        logoUrl={logoUrl}
        showGroupsButton
        websiteUrl={websiteUrl}
        ticketsUrl={ticketsUrl}
      />
      <PhaseLine />
    </>
  );
}

function PhaseLine() {
  const { phase } = useFestivalPhase();
  const { edition, festival } = useFestivalEdition();

  const message = bannerMessage(
    phase,
    edition?.start_date ?? null,
    festival.timezone,
  );
  if (!message) return null;

  return (
    <div className="mb-4 flex items-center justify-center gap-2 text-center text-sm text-purple-200/80">
      {phase === "live" && <LiveDot />}
      {message}
    </div>
  );
}

function CompactIdentityRow({
  title,
  logoUrl,
}: {
  title: string;
  logoUrl?: string | null;
}) {
  const { phase } = useFestivalPhase();

  return (
    <div className="mb-3 flex items-center gap-2">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${title} logo`}
          className="h-8 w-8 rounded object-contain"
        />
      ) : (
        <Music className="h-5 w-5 text-purple-400" />
      )}
      <h2 className="min-w-0 truncate text-lg font-bold text-white">{title}</h2>
      {phase === "live" && (
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-sm text-purple-200/80">
          <LiveDot />
          Live
        </span>
      )}
    </div>
  );
}

function LiveDot() {
  return (
    <span
      aria-hidden="true"
      className="h-2 w-2 shrink-0 rounded-full bg-red-500 animate-pulse"
    />
  );
}
