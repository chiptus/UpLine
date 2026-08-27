import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { setsByEditionQuery } from "@/api/sets/useSetsByEdition";
import { stagesByEditionQuery } from "@/api/stages/useStagesByEdition";
import { useScheduleData } from "@/hooks/useScheduleData";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { useTimelineUrlState } from "@/hooks/useTimelineUrlState";
import { ScheduleNotRevealedPlaceholder } from "../ScheduleNotRevealedPlaceholder";
import { DaysLineupView } from "./DaysLineupView";
import { StagesLineupGrid } from "./StagesLineupGrid";

interface ScheduleLineupViewProps {
  tab: "timeline" | "list";
}

export function ScheduleLineupView({ tab }: ScheduleLineupViewProps) {
  const { canShowDay } = useScheduleReveal();

  if (!canShowDay) {
    return <ScheduleNotRevealedPlaceholder />;
  }

  return <ScheduleLineupContent tab={tab} />;
}

function ScheduleLineupContent({ tab }: ScheduleLineupViewProps) {
  const { canShowStage } = useScheduleReveal();
  const route =
    `/festivals/$festivalSlug/editions/$editionSlug/schedule/${tab}` as const;
  const { festival, edition } = useRouteContext({ from: route });
  const { data: editionSets } = useSuspenseQuery(
    setsByEditionQuery(edition.id),
  );
  const { data: stages } = useSuspenseQuery(stagesByEditionQuery(edition.id));
  const { scheduleDays } = useScheduleData({
    sets: editionSets,
    stages,
    timezone: festival.timezone,
  });
  const { day: selectedDay, stagesIds: selectedStages } =
    useTimelineUrlState(tab);

  const filteredScheduleDays = useMemo(() => {
    return scheduleDays
      .filter((day) => selectedDay === "all" || day.date === selectedDay)
      .map((day) => ({
        ...day,
        stages: day.stages.filter(
          (stage) =>
            !canShowStage ||
            selectedStages.length === 0 ||
            selectedStages.includes(stage.id),
        ),
      }));
  }, [scheduleDays, selectedDay, selectedStages, canShowStage]);

  return canShowStage ? (
    <StagesLineupGrid scheduleDays={filteredScheduleDays} tab={tab} />
  ) : (
    <DaysLineupView scheduleDays={filteredScheduleDays} tab={tab} />
  );
}
