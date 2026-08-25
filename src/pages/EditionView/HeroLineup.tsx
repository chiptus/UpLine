import { useRouteContext } from "@tanstack/react-router";
import { useSetsByEditionQuery } from "@/api/sets/useSetsByEdition";
import { useStagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { useFestivalPhase } from "@/hooks/useFestivalPhase";
import { classifyNowNext } from "@/lib/nowNext";
import type { FestivalSet, Stage } from "@/api/sets/types";
import { cn } from "@/lib/utils";

const MAX_NAMES = 6;
const HEADLINER_COUNT = 2;

interface LineupEntry {
  id: string;
  name: string;
  stageColor: string | null;
  isLive: boolean;
}

export function HeroLineup() {
  const { edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });
  const { phase } = useFestivalPhase();
  const { data: sets } = useSetsByEditionQuery(edition.id);
  const { data: stages } = useStagesByEditionQuery(edition.id);

  const lineup = buildLineup(
    sets ?? [],
    stages ?? [],
    phase === "live" ? new Date() : null,
  );
  if (lineup.length === 0) return null;

  return (
    <div
      data-testid="hero-lineup"
      className="flex max-w-2xl flex-wrap items-baseline justify-center gap-x-4 gap-y-1"
    >
      {lineup.map((entry, index) => (
        <span
          key={entry.id}
          className={cn(
            "font-display uppercase tracking-[0.02em] leading-tight",
            index < HEADLINER_COUNT
              ? "text-xl font-bold md:text-3xl"
              : "text-sm font-medium md:text-lg",
            !entry.stageColor && "text-foreground",
          )}
          style={entry.stageColor ? { color: entry.stageColor } : undefined}
        >
          {entry.name}
          {entry.isLive && (
            <span
              aria-label="On stage now"
              className="ml-1.5 inline-flex items-baseline gap-1 text-xs font-medium normal-case tracking-normal text-live-foreground"
            >
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 shrink-0 self-center rounded-full bg-live animate-pulse"
              />
              Live
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

function buildLineup(
  sets: FestivalSet[],
  stages: Stage[],
  now: Date | null,
): LineupEntry[] {
  const stageColorById = new Map(
    stages.map((stage) => [stage.id, stage.color]),
  );
  const liveSetIds = now
    ? new Set(classifyNowNext(sets, now).nowPlaying.map((set) => set.id))
    : new Set<string>();

  const ranked = [...sets].sort((a, b) => positiveVotes(b) - positiveVotes(a));

  const entries: LineupEntry[] = [];
  const seenArtists = new Set<string>();
  for (const set of ranked) {
    for (const artist of set.artists) {
      if (seenArtists.has(artist.id)) continue;
      seenArtists.add(artist.id);
      entries.push({
        id: artist.id,
        name: artist.name,
        stageColor: set.stage_id
          ? (stageColorById.get(set.stage_id) ?? null)
          : null,
        isLive: liveSetIds.has(set.id),
      });
      if (entries.length >= MAX_NAMES) return entries;
    }
  }
  return entries;
}

function positiveVotes(set: FestivalSet): number {
  return set.votes.filter((vote) => vote.vote_type > 0).length;
}
