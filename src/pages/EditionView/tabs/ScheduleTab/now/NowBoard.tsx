import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { classifyNowNextByStage } from "@/lib/nowNext";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { useSetsByEditionQuery } from "@/api/sets/useSetsByEdition";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { sortStagesByOrder } from "@/lib/stageUtils";
import { NowStageRow } from "./NowStageRow";

export function ScheduleTabNow() {
  const { festival } = useFestivalEdition();
  const { edition } = useRouteContext({
    from: "/festivals/$festivalSlug/editions/$editionSlug/schedule/now",
  });
  const { data: sets = [], isLoading } = useSetsByEditionQuery(edition.id);
  const { data: stages } = useSuspenseQuery(stagesByEditionQuery(edition.id));

  if (isLoading) {
    return (
      <div className="text-center text-purple-300 py-12">
        <p>Loading schedule...</p>
      </div>
    );
  }

  const byStage = classifyNowNextByStage(sets, new Date());
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
