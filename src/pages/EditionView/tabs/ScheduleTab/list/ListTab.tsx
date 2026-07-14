import { FestivalTimeBadge } from "../FestivalTimeBadge";
import { ListSchedule } from "./ListSchedule";
import { ScheduleFilterSheet } from "../ScheduleFilterSheet";
import { VoteFilterChips } from "../VoteFilterChips";
import { FilterContainer } from "@/components/filters/FilterContainer";

export function ScheduleTabList() {
  return (
    <>
      <FestivalTimeBadge />

      <FilterContainer>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-purple-100 font-medium">Filters</h3>
          <div className="ml-auto" />
          <VoteFilterChips tab="list" />
          <ScheduleFilterSheet tab="list" />
        </div>
      </FilterContainer>
      <ListSchedule />
    </>
  );
}
