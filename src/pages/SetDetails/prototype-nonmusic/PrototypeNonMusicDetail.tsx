// PROTOTYPE — throwaway code for wayfinder ticket #396 (non-music set card &
// detail layout). Three variants of the set-detail page for a 0-artist set
// (workshop/performance/other), switchable via `?variant=A|B|C` on the
// existing set-detail route. Delete after a variant is picked.
//
// The set_type / external_url columns and SetTypePlaceholder component do not
// exist yet (decided in #395/#397/#398 but unimplemented), so this stubs a
// workshop set from whatever real set the route loaded: artists stripped,
// set_type + external_url injected.

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Drama,
  ExternalLink,
  Hammer,
  Music,
  Sparkles,
} from "lucide-react";
import { FestivalSet } from "@/api/sets/types";
import { SetVotingButtons } from "@/pages/SetDetails/SetVotingButtons";
import { StagePin } from "@/components/StagePin";
import { MarkdownText } from "@/components/ui/markdown-text";
import { cn } from "@/lib/utils";
import { formatDayOnly, formatTimeRange } from "@/lib/timeUtils";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { useRouteContext } from "@tanstack/react-router";

type SetType = "music" | "workshop" | "performance" | "other";

type PrototypeSet = FestivalSet & {
  set_type: SetType | null;
  external_url: string | null;
};

const TYPE_META: Record<
  SetType,
  { label: string; Icon: typeof Music; gradient: string }
> = {
  music: {
    label: "Music",
    Icon: Music,
    gradient: "from-indigo-500/40 to-purple-500/20",
  },
  workshop: {
    label: "Workshop",
    Icon: Hammer,
    gradient: "from-amber-500/40 to-orange-500/20",
  },
  performance: {
    label: "Performance",
    Icon: Drama,
    gradient: "from-rose-500/40 to-pink-500/20",
  },
  other: {
    label: "Other",
    Icon: Sparkles,
    gradient: "from-slate-500/40 to-slate-400/20",
  },
};

const VARIANTS = ["A", "B", "C"] as const;
const VARIANT_NAMES: Record<string, string> = {
  A: "Tile hero (mirrors current layout)",
  B: "Full-width, no image",
  C: "Type banner",
};

interface PrototypeNonMusicDetailProps {
  set: FestivalSet;
  netVoteScore: number;
  use24Hour: boolean;
  variant: string;
}

export function PrototypeNonMusicDetail({
  set,
  netVoteScore,
  use24Hour,
  variant,
}: PrototypeNonMusicDetailProps) {
  const { festival } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });
  const { canShowStage, canShowDay, canShowTime } = useScheduleReveal();
  const timeRangeFormatted = canShowTime
    ? formatTimeRange(
        set.time_start,
        set.time_end,
        use24Hour,
        festival.timezone,
      )
    : null;
  const dayOnlyFormatted =
    canShowDay && !canShowTime
      ? formatDayOnly(set.time_start, festival.timezone)
      : null;
  const stubSet: PrototypeSet = {
    ...set,
    artists: [],
    set_type: "workshop",
    external_url: "https://example.com/workshop-info",
    name: set.name,
    description:
      set.description ||
      "A hands-on workshop exploring rhythm, movement and connection. Bring comfortable clothes and an open mind — no prior experience needed.",
  };

  const shared = {
    set: stubSet,
    netVoteScore,
    timeRangeFormatted,
    dayOnlyFormatted,
    canShowStage,
  };

  return (
    <>
      {variant === "A" && <VariantTileHero {...shared} />}
      {variant === "B" && <VariantFullWidth {...shared} />}
      {variant === "C" && <VariantBanner {...shared} />}
      <PrototypeSwitcher current={variant} />
    </>
  );
}

interface VariantProps {
  set: PrototypeSet;
  netVoteScore: number;
  timeRangeFormatted: string | null;
  dayOnlyFormatted: string | null;
  canShowStage: boolean;
}

function TypeBadge({ type }: { type: SetType | null }) {
  const meta = TYPE_META[type ?? "other"];
  return (
    <Badge variant="secondary" className="gap-1">
      <meta.Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

function ScoreBadge({ score }: { score: number }) {
  if (score === 0) return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        score > 0
          ? "border-green-400 text-green-400"
          : "border-red-400 text-red-400",
      )}
    >
      Score: {score > 0 ? "+" : ""}
      {score}
    </Badge>
  );
}

function ScheduleRow({
  set,
  canShowStage,
  timeRangeFormatted,
  dayOnlyFormatted,
  className,
}: Pick<
  VariantProps,
  "set" | "canShowStage" | "timeRangeFormatted" | "dayOnlyFormatted"
> & { className?: string }) {
  return (
    <div
      className={cn("flex flex-wrap gap-4 text-muted-foreground", className)}
    >
      {canShowStage && <StagePin stageId={set.stage_id} />}
      {(timeRangeFormatted || dayOnlyFormatted) && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="text-sm">
            {timeRangeFormatted || dayOnlyFormatted}
          </span>
        </div>
      )}
    </div>
  );
}

function ExternalLinkButton({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <Button asChild variant="outline">
      <a href={url} target="_blank" rel="noopener noreferrer">
        More info
        <ExternalLink className="h-4 w-4 ml-2" />
      </a>
    </Button>
  );
}

// Stub of the SetTypePlaceholder decided in #397: lucide icon per type on a
// muted gradient tile, used where an artist image would have gone.
function SetTypePlaceholderTile({
  type,
  className,
}: {
  type: SetType | null;
  className?: string;
}) {
  const meta = TYPE_META[type ?? "other"];
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg bg-gradient-to-br",
        meta.gradient,
        className,
      )}
    >
      <meta.Icon className="h-24 w-24 text-foreground/40" />
    </div>
  );
}

// Variant A — keeps the current two-column grid; the artist image slot is
// filled by the type-placeholder tile, genres become a type badge.
function VariantTileHero({
  set,
  netVoteScore,
  timeRangeFormatted,
  dayOnlyFormatted,
  canShowStage,
}: VariantProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      <SetTypePlaceholderTile type={set.set_type} className="aspect-square" />
      <div className="lg:col-span-2">
        <Card className="bg-surface-raised backdrop-blur-md border h-full">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-foreground mb-2">
              {set.name}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mb-4">
              <TypeBadge type={set.set_type} />
              <ScoreBadge score={netVoteScore} />
            </div>
            <ScheduleRow
              set={set}
              canShowStage={canShowStage}
              timeRangeFormatted={timeRangeFormatted}
              dayOnlyFormatted={dayOnlyFormatted}
              className="mb-4"
            />
            {set.description && (
              <CardDescription className="text-muted-foreground text-lg leading-relaxed">
                <MarkdownText
                  content={set.description}
                  className="prose-sm prose-invert"
                />
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <SetVotingButtons set={set} />
            <ExternalLinkButton url={set.external_url} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Variant B — no image column at all: full-width card, small inline type icon
// beside the title, schedule elevated to a prominent strip.
function VariantFullWidth({
  set,
  netVoteScore,
  timeRangeFormatted,
  dayOnlyFormatted,
  canShowStage,
}: VariantProps) {
  const meta = TYPE_META[set.set_type ?? "other"];
  return (
    <div className="mb-8">
      <Card className="bg-surface-raised backdrop-blur-md border">
        <CardHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br",
                meta.gradient,
              )}
            >
              <meta.Icon className="h-6 w-6 text-foreground/70" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-foreground">
                {set.name}
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {meta.label}
              </span>
            </div>
            <div className="ml-auto">
              <ScoreBadge score={netVoteScore} />
            </div>
          </div>
          <div className="rounded-md border bg-background/40 px-4 py-3 mt-3">
            <ScheduleRow
              set={set}
              canShowStage={canShowStage}
              timeRangeFormatted={timeRangeFormatted}
              dayOnlyFormatted={dayOnlyFormatted}
            />
          </div>
          {set.description && (
            <CardDescription className="text-muted-foreground text-lg leading-relaxed mt-4">
              <MarkdownText
                content={set.description}
                className="prose-sm prose-invert"
              />
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <SetVotingButtons set={set} />
          </div>
          <ExternalLinkButton url={set.external_url} />
        </CardContent>
      </Card>
    </div>
  );
}

// Variant C — full-bleed gradient banner (icon + type + name + schedule) on
// top, then description and voting side by side underneath.
function VariantBanner({
  set,
  netVoteScore,
  timeRangeFormatted,
  dayOnlyFormatted,
  canShowStage,
}: VariantProps) {
  const meta = TYPE_META[set.set_type ?? "other"];
  return (
    <div className="mb-8 space-y-6">
      <div
        className={cn(
          "rounded-lg bg-gradient-to-r p-8 flex items-center gap-6 border",
          meta.gradient,
        )}
      >
        <meta.Icon className="h-16 w-16 shrink-0 text-foreground/60" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-widest text-foreground/70">
              {meta.label}
            </span>
            <ScoreBadge score={netVoteScore} />
          </div>
          <h1 className="text-3xl font-bold text-foreground truncate">
            {set.name}
          </h1>
          <ScheduleRow
            set={set}
            canShowStage={canShowStage}
            timeRangeFormatted={timeRangeFormatted}
            dayOnlyFormatted={dayOnlyFormatted}
            className="mt-2"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="bg-surface-raised backdrop-blur-md border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">About</CardTitle>
            {set.description && (
              <CardDescription className="text-muted-foreground leading-relaxed">
                <MarkdownText
                  content={set.description}
                  className="prose-sm prose-invert"
                />
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <ExternalLinkButton url={set.external_url} />
          </CardContent>
        </Card>
        <Card className="bg-surface-raised backdrop-blur-md border">
          <CardHeader>
            <CardTitle className="text-lg">Your vote</CardTitle>
          </CardHeader>
          <CardContent>
            <SetVotingButtons set={set} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PrototypeSwitcher({ current }: { current: string }) {
  const [, force] = useState(0);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);

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
  });

  if (import.meta.env.PROD) return null;

  const index = Math.max(0, VARIANTS.indexOf(current as "A"));

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-black text-white px-4 py-2 shadow-lg border border-white/20">
      <button type="button" onClick={() => cycle(-1)} aria-label="Previous">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm whitespace-nowrap">
        {VARIANTS[index]} — {VARIANT_NAMES[VARIANTS[index]]}
      </span>
      <button type="button" onClick={() => cycle(1)} aria-label="Next">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );

  function cycle(delta: number) {
    const index = Math.max(0, VARIANTS.indexOf(current as "A"));
    const next = VARIANTS[(index + delta + VARIANTS.length) % VARIANTS.length];
    const url = new URL(window.location.href);
    url.searchParams.set("variant", next);
    window.history.replaceState(null, "", url.toString());
    force((n) => n + 1);
    window.dispatchEvent(new Event("prototype-variant-changed"));
  }
}

export function usePrototypeVariant(): string | null {
  const [, force] = useState(0);
  useEffect(() => {
    function onChange() {
      force((n) => n + 1);
    }
    window.addEventListener("prototype-variant-changed", onChange);
    return () =>
      window.removeEventListener("prototype-variant-changed", onChange);
  }, []);
  if (import.meta.env.PROD) return null;
  return new URLSearchParams(window.location.search).get("variant");
}
