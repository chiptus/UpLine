// PROTOTYPE — per-variant edition header. All non-current variants use the
// content-first identity row (the density verdict); they differ in
// navigation mechanism instead. See chromeVariant.tsx.
import { Music } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { PhaseBanner } from "../PhaseBanner";
import { useChromeVariant } from "./chromeVariant";
import { useFestivalPhase } from "@/hooks/useFestivalPhase";

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
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full bg-red-500 animate-pulse"
          />
          Live
        </span>
      )}
    </div>
  );
}
