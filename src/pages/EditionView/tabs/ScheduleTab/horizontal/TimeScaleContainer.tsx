import type { CSSProperties } from "react";
import { TimeScale } from "./TimeScale";
import type { TimelineData } from "@/lib/timelineCalculator";
import {
  HEADER_STRIP_TOP_CLASS,
  TIMELINE_TOOLBAR_HEIGHT_CSS_VAR,
} from "@/lib/layout-constants";
import { cn } from "@/lib/utils";
import type { FestivalDayConfig } from "@/lib/timeUtils";

interface TimeScaleContainerProps {
  timelineData: TimelineData;
  dayConfig: FestivalDayConfig;
  scrollLeft: number;
  toolbarHeight: number;
}

export function TimeScaleContainer({
  timelineData,
  dayConfig,
  scrollLeft,
  toolbarHeight,
}: TimeScaleContainerProps) {
  return (
    <div
      style={
        {
          [TIMELINE_TOOLBAR_HEIGHT_CSS_VAR]: `${toolbarHeight}px`,
        } as CSSProperties
      }
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
