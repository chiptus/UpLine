import { FestivalTimeBadge } from "../FestivalTimeBadge";
import { ListSchedule } from "./ListSchedule";
import { ScheduleFilterSheet } from "../ScheduleFilterSheet";
import { VoteFilterChips } from "../VoteFilterChips";
import { FilterContainer } from "@/components/filters/FilterContainer";
// PROTOTYPE: chrome-variant exploration (see ../../../prototype/)
import { useChromeVariant } from "../../../prototype/chromeVariant";
import { CompactViewSwitcher } from "../../../prototype/CompactViewSwitcher";

export function ScheduleTabList() {
  const variant = useChromeVariant();

  if (variant === "autohide") {
    return <ListSchedule />;
  }

  if (variant === "tabs" || variant === "thumbbar") {
    return (
      <>
        <div className="flex items-center justify-end gap-1">
          <div className="hidden md:block">
            <VoteFilterChips tab="list" />
          </div>
          <ScheduleFilterSheet tab="list" showLabel />
        </div>
        <ListSchedule />
      </>
    );
  }

  if (variant === "unibar") {
    return (
      <>
        <div className="sticky top-16 md:top-20 z-40 flex items-center gap-1 rounded-lg border border-purple-400/20 bg-gray-900/95 px-2 py-1.5 backdrop-blur-md">
          <CompactViewSwitcher />
          <div className="ml-auto hidden md:block">
            <VoteFilterChips tab="list" />
          </div>
          <div className="ml-auto md:ml-0">
            <ScheduleFilterSheet tab="list" showLabel />
          </div>
        </div>
        <ListSchedule />
      </>
    );
  }

  return (
    <>
      <FestivalTimeBadge />

      <FilterContainer>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-purple-100 font-medium">Filters</h3>
          <div className="ml-auto" />
          <div className="hidden md:block">
            <VoteFilterChips tab="list" />
          </div>
          <ScheduleFilterSheet tab="list" />
        </div>
      </FilterContainer>
      <ListSchedule />
    </>
  );
}
