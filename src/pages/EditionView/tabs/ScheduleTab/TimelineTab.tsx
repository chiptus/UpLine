import { FestivalTimeBadge } from "./FestivalTimeBadge";
import { Timeline } from "./horizontal/Timeline";
// PROTOTYPE: chrome-variant exploration (see ../../prototype/)
import { useChromeVariant } from "../../prototype/chromeVariant";

export function ScheduleTabTimeline() {
  const variant = useChromeVariant();

  return (
    <>
      {variant === "current" && <FestivalTimeBadge />}
      <Timeline />
    </>
  );
}
