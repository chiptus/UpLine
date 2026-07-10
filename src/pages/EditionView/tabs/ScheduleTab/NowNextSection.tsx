import { useQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { classifyNowNext } from "@/lib/nowNext";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { useFestivalPhase } from "@/hooks/useFestivalPhase";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { useSetsByEditionQuery } from "@/api/sets/useSetsByEdition";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { MobileSetCard } from "./list/MobileSetCard";
import type { FestivalSet } from "@/api/sets/types";
import type { Stage } from "@/api/stages/types";
import type { ScheduleSet } from "@/hooks/useScheduleData";

export function NowNextSection() {
  const { phase } = useFestivalPhase();
  const { canShowTime } = useScheduleReveal();

  if (phase !== "live" || !canShowTime) return null;

  return <LiveNowNext />;
}

function LiveNowNext() {
  const { festival } = useFestivalEdition();
  const { edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug/schedule",
  });
  const { data: sets = [] } = useSetsByEditionQuery(edition.id);
  const { data: stages = [] } = useQuery(stagesByEditionQuery(edition.id));

  const { nowPlaying, next } = classifyNowNext(sets, new Date());
  if (!nowPlaying.length && !next.length) return null;

  const nowCards = nowPlaying.map((set) => toCardSet(set, stages));
  const nextCards = next.map((set) => toCardSet(set, stages));

  return (
    <div className="space-y-4">
      {nowCards.length > 0 && (
        <NowNextGroup
          label="On now"
          live
          sets={nowCards}
          timezone={festival.timezone}
        />
      )}
      {nextCards.length > 0 && (
        <NowNextGroup
          label="Up next"
          sets={nextCards}
          timezone={festival.timezone}
        />
      )}
    </div>
  );
}

type CardSet = ScheduleSet & { stageName: string; stageColor?: string };

interface NowNextGroupProps {
  label: string;
  live?: boolean;
  sets: CardSet[];
  timezone: string;
}

function NowNextGroup({ label, live = false, sets, timezone }: NowNextGroupProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3 px-1">
        <div className="flex items-center gap-2 bg-purple-800/50 px-3 py-1.5 rounded-full">
          {live && (
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          )}
          <span className="text-sm font-medium text-purple-200">{label}</span>
        </div>
        <div className="flex-1 h-px bg-purple-400/20"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {sets.map((set) => (
          <MobileSetCard key={set.id} set={set} timezone={timezone} />
        ))}
      </div>
    </div>
  );
}

function toCardSet(set: FestivalSet, stages: Stage[]): CardSet {
  const stage = stages.find((s) => s.id === set.stage_id);
  return {
    id: set.id,
    name: set.name,
    slug: set.slug ?? undefined,
    stageId: set.stage_id ?? undefined,
    startTime: set.time_start ? new Date(set.time_start) : undefined,
    endTime: set.time_end ? new Date(set.time_end) : undefined,
    votes: set.votes ?? [],
    artists: (set.artists ?? []).map((artist) => ({
      id: artist.id,
      name: artist.name,
    })),
    stageName: stage?.name ?? set.stage_name ?? "",
    stageColor: stage?.color ?? undefined,
  };
}
