import { Globe } from "lucide-react";
import { useFestivalEdition } from "@/contexts/FestivalEditionContext";
import { ListSchedule } from "./ListSchedule";
import { ListFilters } from "./ListFilters";

export function ScheduleTabList() {
  const { festival } = useFestivalEdition();

  return (
    <>
      <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-100">
        <Globe className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">
          All times in festival time · {festival.timezone}
        </span>
      </div>

      <ListFilters />
      <ListSchedule />
    </>
  );
}
