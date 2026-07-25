// PROTOTYPE — per-variant edition header. All non-current variants use the
// content-first identity row (the density verdict); they differ in
// navigation mechanism instead. See chromeVariant.tsx.
import { Music } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { PhaseBanner } from "../PhaseBanner";
import { useChromeVariant } from "./chromeVariant";
import { useFestivalPhase } from "@/hooks/useFestivalPhase";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { daysUntilStart } from "@/lib/festivalCountdown";

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

  return (
    <>
      <AppHeader showGroupsButton />
      <CompactIdentityRow title={title} logoUrl={logoUrl} />
    </>
  );
}

function CompactIdentityRow({
  title,
  logoUrl,
}: {
  title: string;
  logoUrl?: string | null;
}) {
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
      <PhaseStatus />
    </div>
  );
}

// The Live dot's slot generalized to all phases: pre-schedule → "Schedule
// soon", planning → countdown, live → pulsing dot + "Live", post → nothing.
function PhaseStatus() {
  const { phase } = useFestivalPhase();
  const { edition, festival } = useFestivalEdition();

  if (phase === "live") {
    return (
      <span className="ml-auto flex shrink-0 items-center gap-1.5 text-sm text-purple-200/80">
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-full bg-red-500 animate-pulse"
        />
        Live
      </span>
    );
  }

  const text = phaseStatusText(
    phase,
    edition?.start_date ?? null,
    festival.timezone,
  );
  if (!text) return null;

  return (
    <span className="ml-auto shrink-0 text-sm text-purple-200/80">{text}</span>
  );
}

function phaseStatusText(
  phase: ReturnType<typeof useFestivalPhase>["phase"],
  startDate: string | null,
  timezone: string,
): string | null {
  if (phase === "pre-schedule") return "Schedule soon";
  if (phase !== "planning") return null;

  const days = daysUntilStart(startDate, new Date(), timezone);
  if (days === null || days <= 0) return "Schedule out";
  if (days === 1) return "1 day to go";
  return `${days} days to go`;
}
