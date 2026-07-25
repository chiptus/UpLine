// PROTOTYPE — per-variant edition header. All non-current variants use the
// content-first identity row (the density verdict); they differ in
// navigation mechanism instead. See chromeVariant.tsx.
import { Music } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { AppHeader } from "@/components/layout/AppHeader";
import { PhaseBanner, bannerMessage } from "../PhaseBanner";
import { useChromeVariant } from "./chromeVariant";
import { useFestivalPhase } from "@/hooks/useFestivalPhase";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { daysUntilStart } from "@/lib/festivalCountdown";
import { cn } from "@/lib/utils";

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

  if (variant === "collapse") {
    return (
      <>
        <AppHeader
          title={title}
          logoUrl={logoUrl}
          showGroupsButton
          websiteUrl={websiteUrl}
          ticketsUrl={ticketsUrl}
          collapsedIdentity={
            <CollapsedIdentity title={title} logoUrl={logoUrl} />
          }
        />
        <PhaseLine />
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

// Full-sentence phase copy as a quiet subtitle under the hero (the
// "collapse" variant's at-rest state).
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
      {phase === "live" && (
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-full bg-red-500 animate-pulse"
        />
      )}
      {message}
    </div>
  );
}

// What the hero collapses into: compact identity in the top bar's center.
function CollapsedIdentity({
  title,
  logoUrl,
}: {
  title: string;
  logoUrl?: string | null;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          className="h-6 w-6 shrink-0 rounded object-contain"
        />
      )}
      <span className="min-w-0 truncate text-sm font-semibold text-white">
        {title}
      </span>
      <PhaseDot />
    </div>
  );
}

// Collapsed state keeps only the color-coded dot — title space is scarce
// in the top bar; the full status text lives in the at-rest hero subtitle.
function PhaseDot() {
  const { phase } = useFestivalPhase();

  const color =
    phase === "live"
      ? "bg-red-500 animate-pulse"
      : phase === "planning"
        ? "bg-amber-400"
        : phase === "pre-schedule"
          ? "bg-slate-400"
          : null;
  if (!color) return null;

  return (
    <span
      aria-hidden="true"
      className={cn("h-2 w-2 shrink-0 rounded-full", color)}
    />
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

// The Live dot's slot generalized to all phases; the three autohide
// variants differ only in this line's treatment:
//   countdown — "Schedule soon" / "N days to go", dot only when live
//   dates+dot — color-coded dot in every phase, date range for planning
//   vote CTA  — dates+dot, but pre-schedule says "Vote now"
function PhaseStatus({ inline }: { inline?: boolean }) {
  const variant = useChromeVariant();
  const { phase } = useFestivalPhase();
  const { edition, festival } = useFestivalEdition();

  if (phase === "post-festival") return null;

  if (phase === "live") {
    return (
      <StatusLine inline={inline} dot="bg-red-500 animate-pulse">
        Live
      </StatusLine>
    );
  }

  if (phase === "planning") {
    if (variant === "autohide-countdown") {
      return (
        <StatusLine inline={inline}>
          {countdownText(edition?.start_date ?? null, festival.timezone)}
        </StatusLine>
      );
    }
    const dates = formatDateRange(
      edition?.start_date,
      edition?.end_date,
      festival.timezone,
    );
    return (
      <StatusLine inline={inline} dot="bg-amber-400">
        {dates ?? countdownText(edition?.start_date ?? null, festival.timezone)}
      </StatusLine>
    );
  }

  // pre-schedule
  if (variant === "autohide-cta") {
    return (
      <StatusLine inline={inline} dot="bg-purple-400">
        Vote now
      </StatusLine>
    );
  }
  if (variant === "autohide-countdown") {
    return <StatusLine inline={inline}>Schedule soon</StatusLine>;
  }
  return (
    <StatusLine inline={inline} dot="bg-slate-400">
      Schedule soon
    </StatusLine>
  );
}

function StatusLine({
  dot,
  inline,
  children,
}: {
  dot?: string;
  inline?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1.5 text-sm text-purple-200/80",
        !inline && "ml-auto",
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn("h-2 w-2 shrink-0 rounded-full", dot)}
        />
      )}
      {children}
    </span>
  );
}

function countdownText(startDate: string | null, timezone: string): string {
  const days = daysUntilStart(startDate, new Date(), timezone);
  if (days === null || days <= 0) return "Schedule out";
  if (days === 1) return "1 day to go";
  return `${days} days to go`;
}

function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  timezone: string,
): string | null {
  if (!start) return null;
  const startText = formatInTimeZone(new Date(start), timezone, "MMM d");
  if (!end) return startText;
  const sameMonth =
    formatInTimeZone(new Date(start), timezone, "MMM") ===
    formatInTimeZone(new Date(end), timezone, "MMM");
  const endText = formatInTimeZone(
    new Date(end),
    timezone,
    sameMonth ? "d" : "MMM d",
  );
  return `${startText}–${endText}`;
}
