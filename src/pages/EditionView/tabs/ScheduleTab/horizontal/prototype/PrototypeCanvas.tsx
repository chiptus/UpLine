// PROTOTYPE (timeline nav & filtering) — throwaway, delete with this folder.
//
// The timeline scroll surface: production TimeScale + StageRows, but with the
// scroll container ref owned by the variant (for scrollTo/jump control) and a
// current-time indicator overlaid on the strip.
import type { RefObject } from "react";
import { TimeScale } from "../TimeScale";
import { StageRow } from "../StageRow";
import { StageLabels } from "../StageLabels";
import { NowIndicator } from "./NowIndicator";
import { PX_PER_MINUTE, CONTENT_OFFSET_PX } from "./useScrollToUrl";
import type { TimelineData } from "@/lib/timelineCalculator";

interface PrototypeCanvasProps {
  timelineData: TimelineData;
  timezone: string;
  scrollRef: RefObject<HTMLDivElement>;
  now: Date | null;
  nowTreatment: "line" | "bubble" | "dashed";
}

export function PrototypeCanvas({
  timelineData,
  timezone,
  scrollRef,
  now,
  nowTreatment,
}: PrototypeCanvasProps) {
  const showNow =
    now !== null &&
    now >= timelineData.festivalStart &&
    now <= timelineData.festivalEnd;
  const nowLeft = now
    ? ((now.getTime() - timelineData.festivalStart.getTime()) / 60_000) *
        PX_PER_MINUTE +
      CONTENT_OFFSET_PX
    : 0;

  return (
    <div className="relative bg-white/5 rounded-lg p-4">
      <StageLabels stages={timelineData.stages} />
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-hidden pb-20"
      >
        <div
          className="relative"
          style={{ minWidth: timelineData.totalWidth }}
        >
          <TimeScale
            timeSlots={timelineData.timeSlots}
            totalWidth={timelineData.totalWidth}
            scrollContainerRef={scrollRef}
            timezone={timezone}
          />
          <div className="space-y-12 mt-28">
            {timelineData.stages.map((stage) => (
              <StageRow
                key={stage.name}
                stage={stage}
                totalWidth={timelineData.totalWidth}
                timezone={timezone}
              />
            ))}
          </div>
          {showNow && (
            <NowIndicator
              left={nowLeft}
              now={now}
              timezone={timezone}
              treatment={nowTreatment}
            />
          )}
        </div>
      </div>
    </div>
  );
}
