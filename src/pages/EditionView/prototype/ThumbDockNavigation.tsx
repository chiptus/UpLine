// PROTOTYPE — "thumbbar" variant: the segmented view switcher docks above
// the bottom tab bar on mobile (thumb-reachable); on desktop it stays a
// normal top row. See chromeVariant.tsx.
import { ScheduleNavigation } from "../tabs/ScheduleTab/ScheduleNavigation";

export function ThumbDockNavigation() {
  return (
    <>
      <div className="hidden md:block">
        <ScheduleNavigation />
      </div>
      <div className="fixed inset-x-4 bottom-20 z-40 md:hidden">
        <div className="rounded-lg bg-gray-900/90 shadow-lg ring-1 ring-purple-400/20 backdrop-blur-md">
          <ScheduleNavigation />
        </div>
      </div>
    </>
  );
}
