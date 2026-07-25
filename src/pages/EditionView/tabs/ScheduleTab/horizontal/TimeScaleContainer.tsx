import { TimeScale } from "./TimeScale";
import type { TimelineData } from "@/lib/timelineCalculator";

interface TimeScaleContainerProps {
  timelineData: TimelineData;
  timezone: string;
  scrollLeft: number;
  top: number;
}

export function TimeScaleContainer({
  timelineData,
  timezone,
  scrollLeft,
  top,
}: TimeScaleContainerProps) {
  return (
    <div
      className="sticky z-30 overflow-hidden bg-gray-900/95 backdrop-blur-md"
      style={{ top }}
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
          scrollLeft={scrollLeft}
        />
      </div>
    </div>
  );
}
