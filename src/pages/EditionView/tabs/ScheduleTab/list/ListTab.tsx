import { FestivalTimeBadge } from "../FestivalTimeBadge";
import { ListSchedule } from "./ListSchedule";
import { ListFilters } from "./ListFilters";

export function ScheduleTabList() {
  return (
    <>
      <FestivalTimeBadge />

      <ListFilters />
      <ListSchedule />
    </>
  );
}
