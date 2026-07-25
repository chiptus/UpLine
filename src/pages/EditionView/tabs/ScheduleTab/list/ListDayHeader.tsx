import { Calendar } from "lucide-react";
import { getFestivalDayLabel } from "@/lib/timeUtils";
import { ScheduleFilterSheet } from "../ScheduleFilterSheet";
import { VoteFilterChips } from "../VoteFilterChips";
import { STICKY_TOP_BELOW_SWITCHER_CLASS } from "@/lib/layout-constants";

interface ListDayHeaderProps {
  dayKey: string;
}

// Rendered once per day-group section (not per time slot), so its sticky
// range spans the whole day rather than un-sticking after one screen. Hosts
// the Filters trigger inline — the list view has no standalone filters row.
export function ListDayHeader({ dayKey }: ListDayHeaderProps) {
  return (
    <div
      className={`sticky ${STICKY_TOP_BELOW_SWITCHER_CLASS} z-10 mb-4 flex items-center gap-2 rounded-lg bg-purple-900/80 px-4 py-2 backdrop-blur-md`}
    >
      <Calendar className="h-4 w-4 text-purple-300 shrink-0" />
      <h2 className="text-lg font-semibold text-purple-100 truncate">
        {getFestivalDayLabel(dayKey)}
      </h2>
      <div className="ml-auto hidden md:block">
        <VoteFilterChips tab="list" />
      </div>
      <div className="ml-auto md:ml-0">
        <ScheduleFilterSheet tab="list" />
      </div>
    </div>
  );
}
