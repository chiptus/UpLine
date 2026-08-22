import { Calendar, List, Radio } from "lucide-react";
import { useFestivalPhase } from "@/hooks/useFestivalPhase";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { ScheduleNavigationItem } from "./ScheduleNavigationItem";

export function ScheduleNavigation() {
  const { phase } = useFestivalPhase();
  const { canShowTime } = useScheduleReveal();

  // Below "full" reveal, Timeline and List render the same lineup view -
  // switching tabs would be a no-op, so there's nothing to navigate between.
  if (!canShowTime) return null;

  const showNow = phase === "live";

  return (
    <div className="bg-surface-raised backdrop-blur-md rounded-lg p-1">
      <div className="flex items-center justify-center gap-1">
        {showNow && (
          <ScheduleNavigationItem view="now" label="Now" icon={Radio} />
        )}
        <ScheduleNavigationItem
          view="timeline"
          label="Timeline"
          icon={Calendar}
        />
        <ScheduleNavigationItem view="list" label="List" icon={List} />
      </div>
    </div>
  );
}
