import { ListSchedule } from "./ListSchedule";
import { ScheduleFilterSheet } from "../ScheduleFilterSheet";
import { VoteFilterChips } from "../VoteFilterChips";
import { FilterContainer } from "@/components/filters/FilterContainer";

export function ScheduleTabList() {
  return (
    <>
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
