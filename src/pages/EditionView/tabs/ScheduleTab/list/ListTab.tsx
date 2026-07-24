import { FestivalTimeBadge } from "../FestivalTimeBadge";
import { ListSchedule } from "./ListSchedule";
import { ScheduleFilterSheet } from "../ScheduleFilterSheet";
import { VoteFilterChips } from "../VoteFilterChips";
import { FilterContainer } from "@/components/filters/FilterContainer";
import { ScheduleLineupView } from "../lineup/ScheduleLineupView";
import { useScheduleReveal } from "@/hooks/useScheduleReveal";

export function ScheduleTabList() {
  const { canShowTime } = useScheduleReveal();

  return (
    <>
      <FestivalTimeBadge />
      {canShowTime ? (
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
      ) : (
        <ScheduleLineupView tab="list" />
      )}
    </>
  );
}
