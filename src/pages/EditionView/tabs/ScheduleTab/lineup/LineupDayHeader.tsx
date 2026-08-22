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
        "sticky z-10 mb-4 flex items-center gap-2 rounded-lg border border-border bg-popover px-4 py-2 backdrop-blur-md",
        STICKY_TOP_BELOW_TOP_BAR_CLASS,
      )}
    >
      <Calendar className="h-4 w-4 text-subtle-foreground" />
      <h2 className="text-lg font-semibold text-foreground">{displayDate}</h2>
      <div className="ml-auto">
        <LineupFilters tab={tab} />
      </div>
    </header>
  );
}
