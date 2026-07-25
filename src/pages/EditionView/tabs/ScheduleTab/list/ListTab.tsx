import { FestivalTimeBadge } from "../FestivalTimeBadge";
import { ListSchedule } from "./ListSchedule";
import { ScheduleFilterSheet } from "../ScheduleFilterSheet";
import { VoteFilterChips } from "../VoteFilterChips";
import { FilterContainer } from "@/components/filters/FilterContainer";
// PROTOTYPE: chrome-variant exploration (see ../../../prototype/)
import { useChromeVariant } from "../../../prototype/chromeVariant";

export function ScheduleTabList() {
  const variant = useChromeVariant();

  if (variant === "autohide") {
    return <ListSchedule />;
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
