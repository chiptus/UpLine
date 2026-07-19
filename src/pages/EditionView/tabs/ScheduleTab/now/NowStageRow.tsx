import { Link, useParams } from "@tanstack/react-router";
import { StageBadge } from "@/components/StageBadge";
import { formatTimeOnly } from "@/lib/timeUtils";
import type { NowNextClassification } from "@/lib/nowNext";
import type { FestivalSet } from "@/api/sets/types";
import type { Stage } from "@/api/stages/types";

interface NowStageRowProps {
  stage: Stage;
  classification: NowNextClassification<FestivalSet>;
  timezone: string;
}

export function NowStageRow({
  stage,
  classification,
  timezone,
}: NowStageRowProps) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-purple-400/30 rounded-lg p-4 space-y-2">
      <StageBadge
        stageName={stage.name}
        stageColor={stage.color ?? undefined}
        size="sm"
      />

      {classification.nowPlaying.map((set) => (
        <SetLine key={set.id} set={set} timezone={timezone} live />
      ))}
      {classification.next.map((set) => (
        <SetLine key={set.id} set={set} timezone={timezone} />
      ))}
    </div>
  );
}

interface SetLineProps {
  set: FestivalSet;
  timezone: string;
  live?: boolean;
}

function SetLine({ set, timezone, live = false }: SetLineProps) {
  const { festivalSlug, editionSlug } = useParams({
    from: "/festivals/$festivalSlug/editions/$editionSlug",
  });

  const time = live
    ? `until ${formatTimeOnly(set.time_end, null, true, timezone)}`
    : `at ${formatTimeOnly(set.time_start, null, true, timezone)}`;

  return (
    <div className="flex items-center gap-2 text-sm">
      {live ? (
        <span className="h-2 w-2 shrink-0 rounded-full bg-red-500 animate-pulse" />
      ) : (
        <span className="shrink-0 text-purple-300">Next:</span>
      )}
      <Link
        to="/festivals/$festivalSlug/editions/$editionSlug/sets/$setSlug"
        params={{ festivalSlug, editionSlug, setSlug: set.slug }}
        className="text-white font-medium hover:text-purple-300 transition-colors truncate"
      >
        {set.name}
      </Link>
      <span className="ml-auto shrink-0 text-purple-200">{time}</span>
    </div>
  );
}
