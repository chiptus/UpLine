import { Calendar, List, Radio } from "lucide-react";
import { useFestivalPhase } from "@/hooks/useFestivalPhase";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";
import { ScheduleNavigationItem } from "./ScheduleNavigationItem";
import { STICKY_TOP_BELOW_TOP_BAR_CLASS } from "@/lib/layout-constants";
import { cn } from "@/lib/utils";

export function ScheduleNavigation() {
  const { phase } = useFestivalPhase();
  const { canShowTime } = useScheduleReveal();
  const showNow = phase === "live" && canShowTime;

  return (
    <div
      className={cn(
        "sticky z-30 bg-background/95 backdrop-blur-md py-2",
        STICKY_TOP_BELOW_TOP_BAR_CLASS,
      )}
    >
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-1">
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
    </div>
  );
}
