import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  redirect,
  useParams,
} from "@tanstack/react-router";
import { StageBadge } from "@/components/StageBadge";
import { setsByEditionQuery } from "@/api/sets/useSetsByEdition";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { useNow } from "@/hooks/useNow";
import { getFestivalPhase } from "@/lib/festivalPhase";
import {
  classifyNowNextByStage,
  type NowNextClassification,
} from "@/lib/nowNext";
import { canShowTime } from "@/lib/scheduleReveal";
import { sortStagesByOrder } from "@/lib/stageUtils";
import { formatTimeOnly } from "@/lib/timeUtils";
import type { FestivalSet } from "@/api/sets/types";
import type { Stage } from "@/api/stages/types";

export const Route = createFileRoute(
  "/festivals/$festivalSlug/editions/$editionSlug/schedule/now",
)({
  component: ScheduleTabNow,
  beforeLoad: ({ params, location, context }) => {
    const phase = getFestivalPhase({
      revealLevel: context.edition.schedule_reveal_level,
      startDate: context.edition.start_date,
      endDate: context.edition.end_date,
      timezone: context.festival.timezone,
      now: new Date(),
    });

    if (
      phase !== "live" ||
      !canShowTime(context.edition.schedule_reveal_level)
    ) {
      throw redirect({
        to: "/festivals/$festivalSlug/editions/$editionSlug/schedule/timeline",
        params,
        search: location.search as Record<string, unknown>,
      });
    }
  },
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(
      setsByEditionQuery(context.edition.id),
    );
  },
});

function ScheduleTabNow() {
  const { festival } = useFestivalEdition();
  const { edition } = Route.useRouteContext();
  const { data: sets } = useSuspenseQuery(setsByEditionQuery(edition.id));
  const { data: stages } = useSuspenseQuery(stagesByEditionQuery(edition.id));
  const now = useNow();

  const byStage = classifyNowNextByStage(sets, now);
  const rows = sortStagesByOrder([...stages]).flatMap((stage) => {
    const classification = byStage.get(stage.id);
    if (!classification) return [];
    if (!classification.nowPlaying.length && !classification.next.length) {
      return [];
    }
    return [{ stage, classification }];
  });

  if (!rows.length) {
    return (
      <div className="text-center text-purple-300 py-12">
        <p>Nothing on right now — see the timeline for the full schedule.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map(({ stage, classification }) => (
        <NowStageRow
          key={stage.id}
          stage={stage}
          classification={classification}
          timezone={festival.timezone}
        />
      ))}
    </div>
  );
}

interface NowStageRowProps {
  stage: Stage;
  classification: NowNextClassification<FestivalSet>;
  timezone: string;
}

function NowStageRow({ stage, classification, timezone }: NowStageRowProps) {
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
