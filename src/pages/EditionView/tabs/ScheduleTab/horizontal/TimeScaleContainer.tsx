import { TimeScale } from "./TimeScale";
import type { TimelineData } from "@/lib/timelineCalculator";
import { HEADER_STRIP_TOP_PX } from "@/lib/layout-constants";
import { useIsMobile } from "@/hooks/use-mobile";

interface TimeScaleContainerProps {
  timelineData: TimelineData;
  timezone: string;
  scrollLeft: number;
}

export function TimeScaleContainer({
  timelineData,
  timezone,
  scrollLeft,
}: TimeScaleContainerProps) {
  const isMobile = useIsMobile();
  const top = isMobile ? HEADER_STRIP_TOP_PX.mobile : HEADER_STRIP_TOP_PX.desktop;

  return (
    <div
      className="sticky z-30 overflow-hidden rounded-b-lg bg-gray-900/95 backdrop-blur-md"
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
