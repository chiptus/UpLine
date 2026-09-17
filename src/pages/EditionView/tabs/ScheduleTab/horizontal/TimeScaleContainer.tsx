import { TimeScale } from "./TimeScale";
import type { TimelineData } from "@/lib/timelineCalculator";
import { HEADER_STRIP_TOP_CLASS } from "@/lib/layout-constants";
import { cn } from "@/lib/utils";

interface TimeScaleContainerProps {
  timelineData: TimelineData;
  timezone: string;
  dayStartHour: number;
  scrollLeft: number;
}

export function TimeScaleContainer({
  timelineData,
  timezone,
  dayStartHour,
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
          timezone={timezone}
          dayStartHour={dayStartHour}
          scrollLeft={scrollLeft}
        />
      </div>
    </div>
  );
}
