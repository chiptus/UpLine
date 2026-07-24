import { FestivalTimeBadge } from "./FestivalTimeBadge";
import { Timeline } from "./horizontal/Timeline";
import { ScheduleLineupView } from "./lineup/ScheduleLineupView";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";

export function ScheduleTabTimeline() {
  const { canShowTime } = useScheduleReveal();

  return (
    <>
      <FestivalTimeBadge />
      {canShowTime ? <Timeline /> : <ScheduleLineupView tab="timeline" />}
    </>
  );
}
