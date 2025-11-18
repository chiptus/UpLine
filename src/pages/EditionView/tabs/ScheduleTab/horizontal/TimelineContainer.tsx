import { useRef, useEffect } from "react";
import { TimeScale } from "./TimeScale";
import { StageRow } from "./StageRow";
import type { TimelineData } from "@/lib/timelineCalculator";
import { differenceInMinutes } from "date-fns";

interface TimelineContainerProps {
  timelineData: TimelineData;
  jumpToTime?: string;
  onScrollComplete?: () => void;
}

export function TimelineContainer({
  timelineData,
  jumpToTime,
  onScrollComplete,
}: TimelineContainerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!jumpToTime || !scrollContainerRef.current) return;

    const targetTime = new Date(jumpToTime);
    const { festivalStart } = timelineData;

    const minutesFromStart = differenceInMinutes(targetTime, festivalStart);
    const scrollPosition = minutesFromStart * 2;

    scrollContainerRef.current.scrollTo({
      left: scrollPosition,
      behavior: "smooth",
    });

    if (onScrollComplete) {
      setTimeout(onScrollComplete, 500);
    }
  }, [jumpToTime, timelineData, onScrollComplete]);

  return (
    <div
      ref={scrollContainerRef}
      className="overflow-x-auto overflow-y-hidden pb-20"
    >
      {/* Time Scale */}
      <TimeScale
        timeSlots={timelineData.timeSlots}
        totalWidth={timelineData.totalWidth}
        scrollContainerRef={scrollContainerRef}
      />

      {/* Stage Rows */}
      <div className="space-y-12 mt-28">
        {timelineData.stages.map((stage) => (
          <StageRow
            key={stage.name}
            stage={stage}
            totalWidth={timelineData.totalWidth}
          />
        ))}
      </div>
    </div>
  );
}
