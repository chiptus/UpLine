import {
  computeDateChanges,
  computeDateLabelGeometry,
} from "./timeScaleGeometry";
import { DateBand } from "./DateBand";
import { HourMarkers } from "./HourMarkers";

interface TimeScaleProps {
  timeSlots: Date[];
  totalWidth: number;
  timezone: string;
  scrollLeft: number;
}

export function TimeScale({
  timeSlots,
  totalWidth,
  timezone,
  scrollLeft,
}: TimeScaleProps) {
  const dateChanges = computeDateChanges(timeSlots, timezone);
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
        timezone={timezone}
      />
      <HourMarkers timeSlots={timeSlots} timezone={timezone} />
    </div>
  );
}
