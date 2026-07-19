import { Calendar, List, Radio } from "lucide-react";
import { useFestivalPhase } from "@/hooks/useFestivalPhase";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { ScheduleNavigationItem } from "./ScheduleNavigationItem";

export function ScheduleNavigation() {
  const { phase } = useFestivalPhase();
  const { canShowTime } = useScheduleReveal();
  const showNow = phase === "live" && canShowTime;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-1">
      <div className="flex items-center justify-center gap-1">
        {showNow && (
          <ScheduleNavigationItem view="now" label="Now" icon={Radio} />
        )}
        <ScheduleNavigationItem
          view="timeline"
          label="Timeline View"
          icon={Calendar}
        />
        <ScheduleNavigationItem view="list" label="List View" icon={List} />
      </div>
    </div>
  );
}
