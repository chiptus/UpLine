import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserVotes } from "@/api/voting/useUserVotes";
import { offsetToTime } from "@/lib/timelineCalculator";
import type { TimelineData } from "@/lib/timelineCalculator";
import type { ScheduleDay } from "@/hooks/useScheduleData";
import {
  calculateDayBoundaries,
  calculateOverviewViewport,
  fractionToOffset,
} from "@/lib/timelineOverviewGeometry";
import { OverviewStageRow } from "./OverviewStageRow";
import { OverviewViewportWindow } from "./OverviewViewportWindow";

interface TimelineOverviewProps {
  timelineData: TimelineData;
  scheduleDays: ScheduleDay[];
  timezone: string;
  scrollContainerRef: RefObject<HTMLDivElement>;
  onJump: (moment: Date) => void;
}

/**
 * Collapsible mini-map of the full (filtered) edition: one thin row per
 * stage showing set density, day boundary lines, the viewer's voted sets in
 * their vote color, and a draggable window over the strip's visible span.
 * Built entirely from the same `timelineData` the strip renders, so it
 * never shows more (or less) than the strip already does.
 */
export function TimelineOverview({
  timelineData,
  scheduleDays,
  timezone,
  scrollContainerRef,
  onJump,
}: TimelineOverviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { data: userVotes } = useUserVotes(user?.id);

  const [viewportSize, setViewportSize] = useState(() =>
    readViewportSize(scrollContainerRef.current),
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    function sync() {
      setViewportSize(readViewportSize(container));
    }

    sync();
    container.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      container.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [scrollContainerRef]);

  const dayBoundaries = calculateDayBoundaries(
    scheduleDays,
    timezone,
    timelineData.festivalStart,
    timelineData.totalWidth,
  );

  const viewportWindow = calculateOverviewViewport(
    viewportSize.scrollLeft,
    viewportSize.clientWidth,
    timelineData.totalWidth,
  );

  return (
    <div
      data-testid="timeline-overview"
      className="mb-4 rounded-lg border border-purple-400/20 bg-gray-900/95 p-3 backdrop-blur-md"
    >
      <div
        ref={mapRef}
        data-testid="timeline-overview-map"
        className="relative cursor-pointer space-y-1 py-1"
        onClick={handleMapClick}
      >
        {dayBoundaries.map((boundary) => (
          <div
            key={boundary.date}
            className="pointer-events-none absolute top-0 h-full w-px bg-purple-400/40"
            style={{ left: `${boundary.leftPercent}%` }}
          />
        ))}

        {timelineData.stages.map((stage) => (
          <OverviewStageRow
            key={stage.name}
            sets={stage.sets}
            totalWidth={timelineData.totalWidth}
            votes={userVotes}
          />
        ))}

        <OverviewViewportWindow
          leftPercent={viewportWindow.leftPercent}
          widthPercent={viewportWindow.widthPercent}
          mapRef={mapRef}
          totalWidth={timelineData.totalWidth}
          scrollContainerRef={scrollContainerRef}
        />
      </div>
    </div>
  );

  function handleMapClick(event: React.MouseEvent<HTMLDivElement>) {
    const map = mapRef.current;
    if (!map) return;

    const rect = map.getBoundingClientRect();
    if (rect.width <= 0) return;

    const fraction = (event.clientX - rect.left) / rect.width;
    const offset = fractionToOffset(fraction, timelineData.totalWidth);
    onJump(offsetToTime(offset, timelineData.festivalStart));
  }
}

function readViewportSize(container: HTMLDivElement | null) {
  return {
    scrollLeft: container?.scrollLeft ?? 0,
    clientWidth: container?.clientWidth ?? 0,
  };
}
