import { useFestivalPhase } from "@/hooks/useFestivalPhase";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { daysUntilStart } from "@/lib/festivalCountdown";
import type { FestivalPhase } from "@/lib/festivalPhase";

export function PhaseBanner() {
  const { phase } = useFestivalPhase();
  const { edition, festival } = useFestivalEdition();

  const message = bannerMessage(
    phase,
    edition?.start_date ?? null,
    festival.timezone,
  );
  if (!message) return null;

  return (
    <div className="mb-4 rounded-lg bg-white/10 backdrop-blur-md px-4 py-2 text-center text-sm text-purple-100">
      {message}
    </div>
  );
}

function bannerMessage(
  phase: FestivalPhase,
  startDate: string | null,
  timezone: string,
): string | null {
  if (phase === "pre-schedule") {
    return "Artists are being announced — schedule coming soon. Vote for who you want to see!";
  }

  if (phase === "planning") {
    return planningCopy(daysUntilStart(startDate, new Date(), timezone));
  }

  if (phase === "live") {
    return "The festival is on — see what's playing now and next!";
  }

  if (phase === "post-festival") {
    return "The festival's over — how were your sets?";
  }

  return null;
}

function planningCopy(days: number | null): string {
  if (days === null) return "Schedule is out — start planning your visit!";
  if (days <= 0) return "Schedule is out — the festival is here!";
  if (days === 1) return "Schedule is out — 1 day to go!";
  return `Schedule is out — ${days} days to go!`;
}
