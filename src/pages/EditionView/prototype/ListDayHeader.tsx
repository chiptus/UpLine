// PROTOTYPE — day-level sticky header for the list view. Rendered once per
// festival day (not per time slot), so its sticky range spans the whole
// day — fixing the header un-sticking after the first slot. On the
// "autohide" variant it also hosts the filter controls. See chromeVariant.tsx.
import { Calendar } from "lucide-react";
import { formatDayOnly } from "@/lib/timeUtils";
import { ScheduleFilterSheet } from "../tabs/ScheduleTab/ScheduleFilterSheet";
import { VoteFilterChips } from "../tabs/ScheduleTab/VoteFilterChips";

interface ListDayHeaderProps {
  isoTime: string;
  timezone?: string;
  withFilters?: boolean;
}

export function ListDayHeader({
  isoTime,
  timezone,
  withFilters,
}: ListDayHeaderProps) {
  return (
    <div className="sticky top-16 md:top-20 z-10 mb-4 flex items-center gap-2 rounded-lg bg-purple-900/80 px-4 py-2 backdrop-blur-md">
      <Calendar className="h-4 w-4 text-purple-300" />
      <h2 className="text-lg font-semibold text-purple-100">
        {formatDayOnly(isoTime, timezone)}
      </h2>
      {withFilters && (
        <>
          <div className="ml-auto hidden md:block">
            <VoteFilterChips tab="list" />
          </div>
          <div className="ml-auto md:ml-0">
            <ScheduleFilterSheet tab="list" />
          </div>
        </>
      )}
    </div>
  );
}
