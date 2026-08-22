import { LineupDayHeader } from "./LineupDayHeader";
import { LineupSetItem } from "./LineupSetItem";
import type { ScheduleDay } from "@/hooks/useScheduleData";

interface DaysLineupViewProps {
  scheduleDays: ScheduleDay[];
  tab: "timeline" | "list";
}

export function DaysLineupView({ scheduleDays, tab }: DaysLineupViewProps) {
  const daysWithSets = scheduleDays
    .map((day) => ({
      ...day,
      sets: day.stages
        .flatMap((stage) => stage.sets)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((day) => day.sets.length > 0);

  if (!daysWithSets.length) {
    return (
      <div className="text-center text-subtle-foreground py-12">
        <p>No scheduled sets found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {daysWithSets.map((day) => (
        <section key={day.date} aria-label={day.displayDate}>
          <LineupDayHeader displayDate={day.displayDate} tab={tab} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {day.sets.map((set) => (
              <LineupSetItem key={set.id} set={set} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
