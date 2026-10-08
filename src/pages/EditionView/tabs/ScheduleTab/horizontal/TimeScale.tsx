import {
  computeDateChanges,
  computeDateLabelGeometry,
} from "./timeScaleGeometry";
import { DateBand } from "./DateBand";
import { HourMarkers } from "./HourMarkers";
import type { FestivalDayConfig } from "@/lib/timeUtils";

interface TimeScaleProps {
  timeSlots: Date[];
  totalWidth: number;
  dayConfig: FestivalDayConfig;
  scrollLeft: number;
}

export function TimeScale({
  timeSlots,
  totalWidth,
  dayConfig,
  scrollLeft,
}: TimeScaleProps) {
  const dateChanges = computeDateChanges(timeSlots, dayConfig);
  const geometry = computeDateLabelGeometry(
    dateChanges,
    scrollLeft,
    totalWidth,
  );

  return (
    <div className="relative" style={{ minWidth: totalWidth }}>
      <DateBand
        dateChanges={dateChanges}
        geometry={geometry}
        totalWidth={totalWidth}
        timezone={dayConfig.timezone}
      />
      <HourMarkers timeSlots={timeSlots} timezone={dayConfig.timezone} />
    </div>
  );
}
