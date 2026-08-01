import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { STICKY_TOP_BELOW_TOP_BAR_CLASS } from "@/lib/layout-constants";
import { LineupFilters } from "./LineupFilters";

interface LineupDayHeaderProps {
  displayDate: string;
  tab: "timeline" | "list";
}

export function LineupDayHeader({ displayDate, tab }: LineupDayHeaderProps) {
  return (
    <header
      className={cn(
        "sticky z-10 mb-4 flex items-center gap-2 rounded-lg border border-purple-400/20 bg-gray-900/95 px-4 py-2 backdrop-blur-md",
        STICKY_TOP_BELOW_TOP_BAR_CLASS,
      )}
    >
      <Calendar className="h-4 w-4 text-purple-300" />
      <h2 className="text-lg font-semibold text-purple-100">{displayDate}</h2>
      <div className="ml-auto">
        <LineupFilters tab={tab} />
      </div>
    </header>
  );
}
