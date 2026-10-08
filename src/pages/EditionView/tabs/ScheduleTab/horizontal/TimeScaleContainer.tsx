import { TimeScale } from "./TimeScale";
import type { TimelineData } from "@/lib/timelineCalculator";
import { HEADER_STRIP_TOP_CLASS } from "@/lib/layout-constants";
import { cn } from "@/lib/utils";
import type { FestivalDayConfig } from "@/lib/timeUtils";

interface TimeScaleContainerProps {
  timelineData: TimelineData;
  dayConfig: FestivalDayConfig;
  scrollLeft: number;
}

export function TimeScaleContainer({
  timelineData,
  dayConfig,
  scrollLeft,
}: TimeScaleContainerProps) {
  return (
    <div
      className={cn(
        "sticky z-30 overflow-hidden rounded-b-lg bg-popover",
        HEADER_STRIP_TOP_CLASS,
      )}
    >
      <div
        style={{
          transform: `translateX(-${scrollLeft}px)`,
          width: timelineData.totalWidth,
        }}
      >
        <TimeScale
          timeSlots={timelineData.timeSlots}
          totalWidth={timelineData.totalWidth}
          dayConfig={dayConfig}
          scrollLeft={scrollLeft}
        />
      </div>
    </div>
  );
}
